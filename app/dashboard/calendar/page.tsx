import { createClient } from "@/lib/supabase/server";
import { format, startOfWeek, addDays, parseISO } from "date-fns";
import { CalendarClient } from "@/components/calendar/CalendarClient";
import { syncAutoMissedAppointments } from "@/lib/actions/appointments";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clinic Calendar",
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ week?: string }>;
}

export default async function CalendarPage({ searchParams }: Props) {
  await syncAutoMissedAppointments();
  const { week } = await searchParams;
  const supabase = await createClient();


  const currentWeekStart = week
    ? parseISO(week)
    : startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday start

  const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");
  const weekEndStr = format(addDays(currentWeekStart, 6), "yyyy-MM-dd");

  const { data: { user } } = await supabase.auth.getUser();
  const { data: userProfile } = user
    ? await supabase.from("users").select("role").eq("id", user.id).single()
    : { data: null };
  const isAdmin = userProfile?.role === "admin";

  let query = supabase
    .from("appointments")
    .select("id, date, time, status, type, patients(id, name, phone), therapists(id, name)")
    .gte("date", weekStartStr)
    .lte("date", weekEndStr)
    .order("time");

  if (!isAdmin && user) {
    const { data: th } = await supabase
      .from("therapists")
      .select("id")
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .maybeSingle();
    if (th?.id) {
      query = query.eq("therapist_id", th.id);
    }
  }

  const { data: appointments } = await query;

  return (
    <CalendarClient
      appointments={appointments ?? []}
      weekStart={weekStartStr}
    />
  );
}
