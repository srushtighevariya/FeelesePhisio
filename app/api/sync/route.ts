import { NextResponse } from "next/server";
import { syncAutoMissedAppointments, syncDayOfReminders } from "@/lib/actions/appointments";

/**
 * GET /api/sync
 * Background sync endpoint. The dashboard fires a fire-and-forget fetch to
 * this route instead of running DB write operations inside the page render.
 * This ensures the page itself is never blocked by sync latency.
 */
export async function GET() {
  try {
    await Promise.all([
      syncAutoMissedAppointments(),
      syncDayOfReminders(),
    ]);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[/api/sync] error:", err?.message);
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
