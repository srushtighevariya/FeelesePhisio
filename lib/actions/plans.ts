"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function upsertPlan(form: Record<string, unknown>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("treatment_plans")
    .upsert(form as any, { onConflict: "patient_id" });
  if (error) throw error;
  revalidatePath(`/dashboard/patients/${form.patient_id}`);
}

export async function getPlan(patientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("treatment_plans")
    .select("*")
    .eq("patient_id", patientId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}
