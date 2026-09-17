"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyTherapistAppointment } from "./notifications";

export async function getAppointments() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("*, patients(name), therapists(name)")
    .order("date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function addAppointment(form: Record<string, unknown>) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("appointments").insert(form as any).select(`
    *,
    patients(id, name, phone),
    therapists(id, name)
  `).single();
  if (error) throw error;

  // Auto-notify the assigned therapist in-app
  if (data?.therapist_id && data?.patients?.name) {
    try {
      await notifyTherapistAppointment({
        therapistId: data.therapist_id as string,
        patientName: data.patients.name,
        date: data.date as string,
        time: data.time as string | null,
        type: data.type as string | null,
        patientId: data.patient_id as string | null,
      });
    } catch {
      // Notification failure should not block appointment creation
    }
  }

  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard");
  return data;
}

export async function updateAppointmentStatus(
  id: string,
  status: "Scheduled" | "Completed" | "Missed" | "Cancelled"
) {
  const supabase = await createClient();
  const { error } = await supabase.from("appointments").update({ status } as any).eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
}

export async function syncAutoMissedAppointments() {
  try {
    const supabase = await createClient();
    // Use Indian Standard Time (Asia/Kolkata) or local time
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const getPart = (t: string) => parts.find((p) => p.type === t)?.value || "00";
    const todayStr = `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
    const currentTimeStr = `${getPart("hour")}:${getPart("minute")}:${getPart("second")}`;

    // 1. Mark appointments from past dates as Missed
    await supabase
      .from("appointments")
      .update({ status: "Missed" } as any)
      .eq("status", "Scheduled")
      .lt("date", todayStr);

    // 2. Mark today's appointments that have already passed their scheduled time as Missed
    await supabase
      .from("appointments")
      .update({ status: "Missed" } as any)
      .eq("status", "Scheduled")
      .eq("date", todayStr)
      .lt("time", currentTimeStr);
  } catch (err) {
    // Non-blocking sync
    console.error("Auto missed sync error:", err);
  }
}

export async function rescheduleAppointment(
  id: string,
  newDate: string,
  newTime: string,
  notes?: string
) {
  const supabase = await createClient();
  const updatePayload: Record<string, unknown> = {
    date: newDate,
    time: newTime,
    status: "Scheduled",
  };
  if (notes) updatePayload.notes = notes;

  const { data, error } = await supabase
    .from("appointments")
    .update(updatePayload as any)
    .eq("id", id)
    .select(`
      *,
      patients(id, name, phone),
      therapists(id, name)
    `)
    .single();

  if (error) throw error;

  // Auto-notify therapist
  if (data?.therapist_id && data?.patients?.name) {
    try {
      await notifyTherapistAppointment({
        therapistId: data.therapist_id as string,
        patientName: data.patients.name,
        date: newDate,
        time: newTime,
        type: "Rescheduled Visit",
        patientId: data.patient_id as string,
      });
    } catch {
      // Non-blocking
    }
  }

  revalidatePath("/dashboard/appointments");
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
  return data;
}

