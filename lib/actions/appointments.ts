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

/**
 * Sends day-of reminders for today's scheduled appointments.
 * - Therapist: in-app "Reminder" notification
 * - Patient: logged WhatsApp/SMS entry visible to admin for dispatch
 * Uses a dedup prefix "Day Reminder:" in the title so it only fires once per appointment per day.
 */
export async function syncDayOfReminders() {
  try {
    const supabase = await createClient();

    // Get today's date in IST
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(now);
    const getPart = (t: string) => parts.find((p) => p.type === t)?.value || "00";
    const todayStr = `${getPart("year")}-${getPart("month")}-${getPart("day")}`;

    // Fetch today's scheduled appointments with patient phone + therapist info
    const { data: todayAppts } = await supabase
      .from("appointments")
      .select(`
        id,
        date,
        time,
        type,
        patient_id,
        therapist_id,
        patients(id, name, phone),
        therapists(id, name)
      `)
      .eq("date", todayStr)
      .eq("status", "Scheduled");

    if (!todayAppts || todayAppts.length === 0) return;

    // Fetch already-sent reminders for today to avoid duplicates
    const { data: existingReminders } = await supabase
      .from("notification_log")
      .select("patient_id, recipient_therapist_id, title")
      .eq("type", "Reminder")
      .gte("sent_at", `${todayStr}T00:00:00`)
      .lte("sent_at", `${todayStr}T23:59:59`);

    const alreadySent = new Set(
      (existingReminders ?? []).map(
        (r: any) => `${r.patient_id}-${r.recipient_therapist_id}`
      )
    );

    for (const appt of todayAppts) {
      const patientId = (appt as any).patient_id as string;
      const therapistId = (appt as any).therapist_id as string;
      const patientName = (appt as any).patients?.name ?? "Patient";
      const patientPhone = (appt as any).patients?.phone ?? null;
      const therapistName = (appt as any).therapists?.name ?? "Therapist";
      const timeStr = appt.time ? (appt.time as string).slice(0, 5) : "";
      const sessionType = appt.type ?? "Physiotherapy Session";

      const dedupKey = `${patientId}-${therapistId}`;
      if (alreadySent.has(dedupKey)) continue; // Already reminded today

      // 1. In-app reminder → Therapist
      if (therapistId) {
        await supabase.from("notification_log").insert({
          type: "Reminder",
          title: "Day Reminder: Appointment Today",
          message: `Reminder: ${patientName} has a ${sessionType} appointment today${timeStr ? " at " + timeStr : ""}.`,
          patient_id: patientId,
          therapist_id: therapistId,
          recipient_therapist_id: therapistId,
          is_read: false,
        } as any);
      }

      // 2. Patient reminder → logged for admin WhatsApp/SMS dispatch
      if (patientId) {
        const patientMsg = `Hi ${patientName}, this is a reminder from FeelEase Physio. You have a ${sessionType} appointment today${timeStr ? " at " + timeStr : ""}. Please be on time. – Dr. ${therapistName}`;
        await supabase.from("notification_log").insert({
          type: patientPhone ? "WhatsApp" : "Reminder",
          title: "Day Reminder: Patient Appointment",
          message: patientMsg,
          patient_id: patientId,
          therapist_id: therapistId ?? null,
          recipient_therapist_id: null,
          is_read: true, // Admin-side, mark read by default
        } as any);
      }
    }
  } catch (err) {
    console.error("Day-of reminder sync error:", err);
  }
}
