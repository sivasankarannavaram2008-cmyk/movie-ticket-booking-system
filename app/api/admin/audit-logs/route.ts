import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { getAuditLogs, StoredAuditLog } from "@/lib/audit-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");

    let logs: StoredAuditLog[] = [];

    // 1. If Supabase configured, query booking_audit_logs
    if (isSupabaseConfigured()) {
      try {
        let query = supabaseAdmin
          .from("booking_audit_logs")
          .select("*")
          .order("changed_at", { ascending: false });

        if (bookingId) {
          query = query.eq("booking_id", bookingId);
        }

        const { data, error } = await query;
        if (!error && data) {
          logs = data.map((d) => ({
            id: d.id,
            bookingId: d.booking_id,
            previousStatus: d.previous_status,
            newStatus: d.new_status,
            changedAt: d.changed_at,
            notes: d.notes,
          }));
        }
      } catch (err) {
        console.warn("Supabase audit logs fetch notice:", err);
      }
    }

    // 2. Fallback / Merge with unified in-memory audit store
    const localLogs = getAuditLogs(bookingId || undefined);
    const existingIds = new Set(logs.map((l) => l.id));
    for (const l of localLogs) {
      if (!existingIds.has(l.id)) {
        logs.push(l);
      }
    }

    return NextResponse.json({ logs, count: logs.length }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/audit-logs error:", err);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
