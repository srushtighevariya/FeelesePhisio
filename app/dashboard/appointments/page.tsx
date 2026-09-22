import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AppointmentsClient } from "@/components/appointments/AppointmentsClient";
import { syncAutoMissedAppointments } from "@/lib/actions/appointments";
import { getCachedAuthUser } from "@/lib/auth-cache";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Appointments Schedule",
};

export const dynamic = "force-dynamic";

export default async function AppointmentsPage() {
  // Non-blocking auto-missed sync
  void syncAutoMissedAppointments();

  const auth = await getCachedAuthUser();
  const isAdmin = auth?.isAdmin ?? false;
  const therapistId = auth?.therapistId;

  const supabase = await createClient();

  let query = supabase
    .from("appointments")
    .select("*, patients(id,name), therapists(id,name)")
    .order("date", { ascending: false });

  if (!isAdmin && therapistId) {
    query = query.eq("therapist_id", therapistId);
  }

  const { data: appts } = await query;

  return (
    <div className="space-y-6 animate-fade-in pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-lg">
            {isAdmin ? "Clinic Appointments" : "My Appointments"}
          </h1>
          <p className="body-sm mt-0.5">{appts?.length ?? 0} scheduled and recorded clinical visits</p>
        </div>
        <Link
          href="/dashboard/appointments/new"
          id="add-appt-btn"
          className="btn-primary"
        >
          <Plus size={15} /> Book Appointment
        </Link>
      </div>

      <AppointmentsClient appts={appts ?? []} />
    </div>
  );
}
