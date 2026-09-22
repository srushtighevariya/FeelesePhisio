import { createClient } from "@/lib/supabase/server";
import { format, startOfWeek, addDays, parseISO } from "date-fns";
import { CalendarClient } from "@/components/calendar/CalendarClient";
import { syncAutoMissedAppointments } from "@/lib/actions/appointments";
import { getCachedAuthUser } from "@/lib/auth-cache";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clinic Calendar",
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ week?: string }>;
}

export default async function CalendarPage({ searchParams }: Props) {
  // Non-blocking auto missed sync
  void syncAutoMissedAppointments();

  const { week } = await searchParams;
  const auth = await getCachedAuthUser();
  const isAdmin = auth?.isAdmin ?? false;
  const therapistId = auth?.therapistId;

  const supabase = await createClient();

  const currentWeekStart = week
    ? parseISO(week)
    : startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday start

  const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");
  const weekEndStr = format(addDays(currentWeekStart, 6), "yyyy-MM-dd");

  let query = supabase
    .from("appointments")
    .select("id, date, time, status, type, patients(id, name, phone), therapists(id, name)")
    .gte("date", weekStartStr)
    .lte("date", weekEndStr)
    .order("time");

  if (!isAdmin && therapistId) {
    query = query.eq("therapist_id", therapistId);
  }

  const { data: appointments } = await query;

  return (
    <CalendarClient
      appointments={appointments ?? []}
      weekStart={weekStartStr}
    />
  );
}
