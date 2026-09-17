"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getAttendance(date?: string) {
  const supabase = await createClient();
  let q = supabase.from("attendance").select("*, therapists(name)");
  if (date) q = q.eq("date", date);
  const { data, error } = await q.order("date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function upsertAttendance(form: Record<string, unknown>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance")
    .upsert(form as any, { onConflict: "therapist_id,date" })
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/dashboard/attendance");
  return data;
}
