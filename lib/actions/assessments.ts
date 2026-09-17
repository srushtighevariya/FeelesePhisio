"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function upsertAssessment(form: Record<string, unknown>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("assessments")
    .upsert(form as any, { onConflict: "patient_id" });
  if (error) throw error;
  revalidatePath(`/dashboard/patients/${form.patient_id}`);
}

export async function getAssessment(patientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessments")
    .select("*")
    .eq("patient_id", patientId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}
