"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getPatients() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("*, therapists(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getPatient(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("*, therapists(id,name), sessions(*), assessments(*), treatment_plans(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function addPatient(form: Record<string, unknown>) {
  const supabase = await createClient();
  const payload = {
    ...form,
    therapist_id: form.therapist_id ? String(form.therapist_id) : null,
    code: form.code ? String(form.code) : `PT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
  };
  const { data, error } = await supabase.from("patients").insert(payload as any).select().single();
  if (error) throw new Error(error.message || "Failed to create patient");
  revalidatePath("/dashboard/patients");
  return data;
}

export async function updatePatient(id: string, form: Record<string, unknown>) {
  const supabase = await createClient();
  const payload = {
    ...form,
    ...(form.therapist_id !== undefined && {
      therapist_id: form.therapist_id ? String(form.therapist_id) : null,
    }),
  };
  const { error } = await supabase.from("patients").update(payload as any).eq("id", id);
  if (error) throw new Error(error.message || "Failed to update patient");
  revalidatePath(`/dashboard/patients/${id}`);
}
