"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getExercises() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("exercises").select("*").order("name");
  if (error) throw error;
  return data;
}

export async function addExercise(form: Record<string, unknown>) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("exercises").insert(form as any).select().single();
  if (error) throw error;
  revalidatePath("/dashboard/exercises");
  return data;
}
