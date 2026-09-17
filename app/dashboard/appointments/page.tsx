import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AppointmentsClient } from "@/components/appointments/AppointmentsClient";
import { syncAutoMissedAppointments } from "@/lib/actions/appointments";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Appointments Schedule",
};

export const dynamic = "force-dynamic";

export default async function AppointmentsPage() {
  await syncAutoMissedAppointments();
  const supabase = await createClient();


  const { data: { user } } = await supabase.auth.getUser();
  const { data: userProfile } = user
    ? await supabase.from("users").select("role").eq("id", user.id).single()
    : { data: null };
  const isAdmin = userProfile?.role === "admin";

  let query = supabase
    .from("appointments")
    .select("*, patients(id,name), therapists(id,name)")
    .order("date", { ascending: false });

  if (!isAdmin && user) {
    const { data: th } = await supabase
      .from("therapists")
      .select("id")
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .maybeSingle();
    if (th?.id) {
      query = query.eq("therapist_id", th.id);
    }
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
