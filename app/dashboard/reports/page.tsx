import { createClient } from "@/lib/supabase/server";
import { ReportsHubClient } from "@/components/reports/ReportsHubClient";
import { getCurrentTherapist } from "@/lib/actions/therapists";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clinical Reports & Analytics",
};

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("users").select("role").eq("id", user.id).single()
    : { data: null };
  const { isAdmin, therapist } = await getCurrentTherapist();
  const therapistId = therapist?.id || null;

  const [
    { data: patients },
    { data: therapists },
    { data: appts },
    { data: attendance },
  ] = await Promise.all([
    supabase.from("patients").select("id, name, age, gender, diagnosis, status, created_at").order("name"),
    supabase.from("therapists").select("id, name, specialty").order("name"),
    supabase.from("appointments").select("therapist_id, date, status"),
    supabase.from("attendance").select("therapist_id, date, status, hours_worked"),
  ]);

  // If therapist: strictly only pass their own therapist profile, NEVER the full list
  const filteredTherapists = isAdmin
    ? (therapists ?? [])
    : (therapist ? [therapist] : ((therapists ?? []).slice(0, 1)));

  return (
    <ReportsHubClient
      patients={patients ?? []}
      therapists={filteredTherapists}
      appts={appts ?? []}
      attendance={attendance ?? []}
      isAdmin={isAdmin}
      currentTherapistId={therapistId}
    />
  );
}

