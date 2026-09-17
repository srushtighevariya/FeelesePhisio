import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PatientProfileClient } from "@/components/patients/PatientProfile";

export default async function PatientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: userProfile } = user
    ? await supabase.from("users").select("role").eq("id", user.id).single()
    : { data: null };
  const isAdmin = userProfile?.role === "admin";

  const [
    { data: patient, error },
    { data: sessions },
    { data: assessment },
    { data: plan },
    { data: therapists },
  ] = await Promise.all([
    supabase.from("patients").select("*, therapists(id,name,specialty)").eq("id", id).single(),
    supabase.from("sessions").select("*").eq("patient_id", id).order("date", { ascending: false }),
    supabase.from("assessments").select("*").eq("patient_id", id).maybeSingle(),
    supabase.from("treatment_plans").select("*").eq("patient_id", id).maybeSingle(),
    supabase.from("therapists").select("id,name,specialty").order("name"),
  ]);

  if (error || !patient) notFound();

  return (
    <PatientProfileClient
      patient={patient}
      sessions={sessions ?? []}
      assessment={assessment}
      plan={plan}
      therapists={therapists ?? []}
      isAdmin={isAdmin}
    />
  );
}
