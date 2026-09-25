import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getCachedAuthUser } from "@/lib/auth-cache";
import { PatientsClient } from "@/components/patients/PatientsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Patient Records" };

export default async function PatientsPage() {
  const auth = await getCachedAuthUser();
  const isAdmin = auth?.isAdmin ?? false;
  const therapistId = auth?.therapistId;

  const supabase = await createClient();

  // Load all patients (scoped by role) once — all filtering is instant client-side
  let query = supabase
    .from("patients")
    .select("id,code,name,age,gender,diagnosis,status,therapist_id,therapists(id,name)")
    .order("created_at", { ascending: false });

  if (!isAdmin && therapistId) {
    query = query.eq("therapist_id", therapistId);
  }

  const [{ data: patients }, { data: therapists }] = await Promise.all([
    query,
    supabase.from("therapists").select("id,name").order("name"),
  ]);

  return (
    <div className="space-y-6 animate-fade-in pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-lg">
            {isAdmin ? "Patient Records" : "My Patient Cases"}
          </h1>
          <p className="body-sm mt-0.5">{patients?.length ?? 0} active recovery patient cases</p>
        </div>
        <Link
          href="/dashboard/patients/new"
          id="add-patient-btn"
          className="btn-primary"
        >
          <Plus size={15} /> Register New Patient
        </Link>
      </div>

      {/* PatientsClient handles instant client-side filtering — no router.push */}
      <PatientsClient
        patients={(patients as any) ?? []}
        therapists={therapists ?? []}
        isAdmin={isAdmin}
      />
    </div>
  );
}
