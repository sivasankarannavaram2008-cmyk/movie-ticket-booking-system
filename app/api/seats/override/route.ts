import { NextRequest, NextResponse } from "next/server";
import { getBlockedSeats, toggleSeatBlocked } from "@/lib/redis";

export const dynamic = "force-dynamic";

/**
 * GET /api/seats/override?showId=...
 * Retrieve blocked seats for a screening.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const showId = searchParams.get("showId");

    if (!showId) {
      return NextResponse.json({ error: "Missing showId parameter" }, { status: 400 });
    }

    const blockedSeats = await getBlockedSeats(showId);
    return NextResponse.json({ showId, blockedSeats, count: blockedSeats.length }, { status: 200 });
  } catch (err: unknown) {
    console.error("GET /api/seats/override error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch blocked seats" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/seats/override
 * Toggle, block, or unblock a seat for physical repair, VIP reservation, or maintenance.
 * Body: { showId: string, seatId: string, action?: "BLOCK" | "UNBLOCK" | "TOGGLE" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { showId, seatId, action } = body;

    if (!showId || typeof showId !== "string") {
      return NextResponse.json({ error: "Missing or invalid showId" }, { status: 400 });
    }

    if (!seatId || typeof seatId !== "string") {
      return NextResponse.json({ error: "Missing or invalid seatId" }, { status: 400 });
    }

    const result = await toggleSeatBlocked(showId, seatId, action);

    return NextResponse.json(
      {
        success: true,
        showId,
        seatId,
        isBlocked: result.isBlocked,
        blockedSeats: result.blockedSeats,
        message: result.isBlocked
          ? `Seat ${seatId} is now BLOCKED for maintenance.`
          : `Seat ${seatId} is now AVAILABLE.`,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("POST /api/seats/override error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to toggle seat maintenance block" },
      { status: 500 }
    );
  }
}
