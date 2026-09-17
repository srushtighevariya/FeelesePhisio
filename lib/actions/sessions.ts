"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addSession(form: Record<string, unknown>) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("sessions").insert(form as any).select().single();
  if (error) throw error;
  revalidatePath(`/dashboard/patients/${form.patient_id}`);
  revalidatePath(`/dashboard/reports/${form.patient_id}`);
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard");
  return data;
}

export async function getSessions(patientId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("patient_id", patientId)
    .order("date", { ascending: false });
  if (error) throw error;
  return data;
}
