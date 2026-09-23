import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { getBookingStore, cancelBookingInStore } from "@/lib/booking-store";
import { addAuditLog } from "@/lib/audit-store";
import { releaseSeatLocks } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, reason = "Customer requested cancellation & refund via Admin Console" } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing required parameter: bookingId" },
        { status: 400 }
      );
    }

    let foundBookingId = bookingId;
    let previousStatus = "CONFIRMED";
    let showId = "";
    let seatIds: string[] = [];
    let refundedAmount = 0;

    // 1. Check local unified booking store
    const store = getBookingStore();
    const storeTarget = store.find((b) => b.id === bookingId || b.refId === bookingId);
    if (storeTarget) {
      foundBookingId = storeTarget.id;
      previousStatus = storeTarget.status;
      showId = storeTarget.showId;
      seatIds = storeTarget.seatIds || [];
      refundedAmount = storeTarget.totalAmount || 0;
    }

    // 2. Database transaction / sequential validation with Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        let dbQuery = supabaseAdmin
          .from("bookings")
          .select(`
            id,
            booking_ref,
            status,
            show_id,
            total_amount,
            booking_seats (
              seat_id
            )
          `);

        if (isValidUUID(bookingId)) {
          dbQuery = dbQuery.eq("id", bookingId);
        } else {
          dbQuery = dbQuery.or(`booking_ref.eq.${bookingId},qr_code_hash.eq.${bookingId}`);
        }

        const { data: dbBooking, error: dbErr } = await dbQuery.maybeSingle();

        if (!dbErr && dbBooking) {
          foundBookingId = dbBooking.id;
          previousStatus = dbBooking.status || "CONFIRMED";
          showId = dbBooking.show_id || showId;
          refundedAmount = Number(dbBooking.total_amount) || refundedAmount;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dbSeatIds = (dbBooking.booking_seats || [])
            .map((bs: any) => bs.seat_id)
            .filter(Boolean);

          if (dbSeatIds.length > 0) {
            seatIds = Array.from(new Set([...seatIds, ...dbSeatIds]));
          }

          // A. Update bookings.status to 'CANCELLED'
          // Triggers `trg_booking_status_change` in Supabase PostgreSQL
          const { error: updateErr } = await supabaseAdmin
            .from("bookings")
            .update({ status: "CANCELLED" })
            .eq("id", dbBooking.id);

          if (updateErr) {
            console.error("Supabase booking status update error:", updateErr);
          }

          // B. Remove rows from booking_seats associated with that booking
          const { error: deleteSeatsErr } = await supabaseAdmin
            .from("booking_seats")
            .delete()
            .eq("booking_id", dbBooking.id);

          if (deleteSeatsErr) {
            console.warn("Supabase booking_seats delete error:", deleteSeatsErr);
          }

          // C. Insert explicit audit log entry detailing cancellation reason
          try {
            await supabaseAdmin.from("booking_audit_logs").insert({
              booking_id: dbBooking.id,
              previous_status: previousStatus,
              new_status: "CANCELLED",
              notes: reason,
            });
          } catch (auditErr) {
            console.warn("Supabase booking_audit_logs insert note:", auditErr);
          }
        }
      } catch (err) {
        console.warn("Supabase cancel operation encountered issue:", err);
      }
    }

    // 3. Cancel in local unified booking store
    cancelBookingInStore(bookingId);

    // 4. Record entry in unified audit store
    const auditEntry = addAuditLog({
      bookingId: foundBookingId,
      previousStatus,
      newStatus: "CANCELLED",
      notes: reason,
    });

    // 5. Delete any lingering Redis lock keys for those seats if still active
    let releasedSeats: string[] = [];
    if (showId && seatIds.length > 0) {
      try {
        const unlockRes = await releaseSeatLocks(showId, seatIds, "admin", true);
        releasedSeats = unlockRes.releasedSeats;
      } catch (lockErr) {
        console.warn("Redis unlock warning during cancellation:", lockErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Booking ${bookingId} has been successfully cancelled and refunded.`,
        bookingId: foundBookingId,
        previousStatus,
        newStatus: "CANCELLED",
        refundedAmount,
        seatsReleased: seatIds.length || releasedSeats.length,
        auditLog: auditEntry,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to cancel booking";
    console.error("POST /api/bookings/cancel error:", err);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}

export const PATCH = POST;
