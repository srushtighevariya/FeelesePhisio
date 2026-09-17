"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notification_log")
    .select("*, patients(name), therapists(name)")
    .order("sent_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data;
}

/** Used by admin to manually send a notification to a patient (logs it). */
export async function logNotification(form: Record<string, unknown>) {
  const supabase = await createClient();
  const { error } = await supabase.from("notification_log").insert(form as any);
  if (error) throw error;
  revalidatePath("/dashboard/notifications");
}

/**
 * Auto-notify a therapist when an appointment is booked for them.
 * Creates a notification_log row that appears in the therapist's in-app feed.
 */
export async function notifyTherapistAppointment({
  therapistId,
  patientName,
  date,
  time,
  type,
  patientId,
}: {
  therapistId: string;
  patientName: string;
  date: string;
  time?: string | null;
  type?: string | null;
  patientId?: string | null;
}) {
  const supabase = await createClient();
  const timeStr = time ? ` at ${time.slice(0, 5)}` : "";
  const message = `New appointment booked: ${patientName} on ${date}${timeStr} — ${type || "Physiotherapy Session"}`;
  await supabase.from("notification_log").insert({
    type: "Appointment",
    title: "New Appointment Booked",
    patient_id: patientId ?? null,
    therapist_id: therapistId,
    recipient_therapist_id: therapistId,
    message,
    is_read: false,
  } as any);
  // No revalidate needed — therapist fetches via realtime
}

/** Mark a notification as read (called from client side). */
export async function markNotificationRead(id: string) {
  const supabase = await createClient();
  await supabase
    .from("notification_log")
    .update({ is_read: true } as any)
    .eq("id", id);
}

/** Get unread count for the current therapist. */
export async function getMyUnreadCount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data: th } = await supabase
    .from("therapists")
    .select("id")
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .maybeSingle();
  if (!th?.id) return 0;
  const { count } = await supabase
    .from("notification_log")
    .select("*", { count: "exact", head: true })
    .eq("recipient_therapist_id", th.id)
    .eq("is_read", false);
  return count ?? 0;
}

/** Get notifications for the current therapist's inbox. */
export async function getMyNotifications() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: th } = await supabase
    .from("therapists")
    .select("id")
    .or(`user_id.eq.${user.id},email.eq.${user.email}`)
    .maybeSingle();
  if (!th?.id) return [];
  const { data } = await supabase
    .from("notification_log")
    .select("*, patients(name)")
    .eq("recipient_therapist_id", th.id)
    .order("sent_at", { ascending: false })
    .limit(30);
  return data ?? [];
}
