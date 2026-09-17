"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getReport(therapistId: string, month: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("monthly_reports")
    .select("*")
    .eq("therapist_id", therapistId)
    .eq("month", month)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data as {
    clinical_learning: string | null;
    google_reviews: number | null;
    video_patients: number | null;
    success_stories: string | null;
    remark: string | null;
  } | null;
}

export async function saveReport(form: Record<string, unknown>) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("monthly_reports")
    .upsert(form as any, { onConflict: "therapist_id,month" });
  if (error) throw error;
  revalidatePath("/dashboard/reports");
  return { success: true };
}
