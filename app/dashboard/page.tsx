import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { syncAutoMissedAppointments, syncDayOfReminders } from "@/lib/actions/appointments";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Clinic Dashboard",
};

export default async function DashboardPage() {
  // Run background syncs — non-blocking
  void syncAutoMissedAppointments();
  void syncDayOfReminders();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const today = format(new Date(), "yyyy-MM-dd");
  const thirtyDaysAgo = format(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    "yyyy-MM-dd"
  );

  // Fetch user profile
  const { data: profile } = await supabase
    .from("users")
    .select("role, name")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "therapist") as "admin" | "therapist";
  const userName = profile?.name ?? user.email ?? "Doctor";
  const isAdmin = role === "admin";

  // If therapist, find therapist record
  let currentTherapist: any = null;
  if (!isAdmin) {
    const { data: th } = await supabase
      .from("therapists")
      .select("id, name, specialty")
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .maybeSingle();
    currentTherapist = th;
  }

  // Base queries scoped if therapist
  let patientQuery = supabase.from("patients").select("*", { count: "exact", head: true });
  let sessionsQuery = supabase.from("sessions").select("*", { count: "exact", head: true });
  let apptsCountQuery = supabase.from("appointments").select("*", { count: "exact", head: true });

  let todaySessionsQuery = supabase
    .from("sessions")
    .select("id, patient_id, therapist_id, date, patients(name)")
    .eq("date", today);

  let todayApptsQuery = supabase
    .from("appointments")
    .select("id, patient_id, therapist_id, date, time, status, type, patients(name, phone)")
    .eq("date", today)
    .order("time");

  let upcomingApptsQuery = supabase
    .from("appointments")
    .select("id, patient_id, therapist_id, date, time, status, type, patients(name)")
    .gte("date", today)
    .order("date")
    .order("time")
    .limit(8);

  // Active rehab cases: patients with Ongoing status + their session counts
  let activePlansQuery = supabase
    .from("patients")
    .select("id, name, diagnosis, status, therapist_id, therapists(name)")
    .in("status", ["Active", "Ongoing", "New"])
    .order("created_at", { ascending: false })
    .limit(6);

  let recentPatientsQuery = supabase
    .from("patients")
    .select("id, name, age, gender, diagnosis, status, created_at")
    .order("created_at", { ascending: false })
    .limit(6);

  let inactivePatientsQuery = supabase
    .from("patients")
    .select("id, name, phone, created_at")
    .lt("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: true })
    .limit(8);

  if (!isAdmin && currentTherapist?.id) {
    patientQuery = patientQuery.eq("therapist_id", currentTherapist.id);
    sessionsQuery = sessionsQuery.eq("therapist_id", currentTherapist.id);
    apptsCountQuery = apptsCountQuery.eq("therapist_id", currentTherapist.id);
    todaySessionsQuery = todaySessionsQuery.eq("therapist_id", currentTherapist.id);
    todayApptsQuery = todayApptsQuery.eq("therapist_id", currentTherapist.id);
    upcomingApptsQuery = upcomingApptsQuery.eq("therapist_id", currentTherapist.id);
    activePlansQuery = activePlansQuery.eq("therapist_id", currentTherapist.id);
    recentPatientsQuery = recentPatientsQuery.eq("therapist_id", currentTherapist.id);
    inactivePatientsQuery = inactivePatientsQuery.eq("therapist_id", currentTherapist.id);
  }

  const [
    { count: totalPatients },
    { count: totalSessions },
    { count: totalAppointments },
    { data: rawTodaySessions },
    { data: rawTodayAppointments },
    { data: rawRecentPatients },
    { data: rawActivePlans },
    { data: rawUpcomingAppointments },
    { data: rawInactivePatients },
    { data: rawTherapists },
  ] = await Promise.all([
    patientQuery,
    sessionsQuery,
    apptsCountQuery,
    todaySessionsQuery,
    todayApptsQuery,
    recentPatientsQuery,
    activePlansQuery,
    upcomingApptsQuery,
    inactivePatientsQuery,
    isAdmin
      ? supabase.from("therapists").select("id, name, specialty, phone, patient_count, patients(count)").order("name").limit(4)
      : Promise.resolve({ data: [] }),
  ]);

  const todaySessions = rawTodaySessions ?? [];
  const todayAppointments = rawTodayAppointments ?? [];
  const recentPatients = rawRecentPatients ?? [];
  const activePlans = rawActivePlans ?? [];
  const upcomingAppointments = rawUpcomingAppointments ?? [];
  const inactivePatients = rawInactivePatients ?? [];
  const allTherapists = rawTherapists ?? [];

  // Calculate snapshot metrics
  const sessionsToday = todaySessions.length;
  const patientIdsToday = new Set([
    ...todaySessions.map((s: any) => s.patient_id),
    ...todayAppointments.map((a: any) => a.patient_id),
  ]);
  const patientsToday = patientIdsToday.size;
  // Estimated hours: 45 min per session/appointment
  const hoursToday = Math.round(((sessionsToday || todayAppointments.length) * 0.75) * 10) / 10;

  // Appointment status counts
  const apptStatusCounts = {
    scheduled: todayAppointments.filter((a: any) => (a.status || "").toLowerCase() === "scheduled").length,
    completed: todayAppointments.filter((a: any) => (a.status || "").toLowerCase() === "completed").length,
    cancelled: todayAppointments.filter((a: any) => (a.status || "").toLowerCase() === "cancelled").length,
    missed:    todayAppointments.filter((a: any) => (a.status || "").toLowerCase() === "missed").length,
  };

  return (
    <DashboardClient
      stats={{
        totalPatients: totalPatients ?? 0,
        totalSessions: totalSessions ?? 0,
        totalAppointments: totalAppointments ?? 0,
        sessionsToday,
        patientsToday,
        hoursToday,
      }}
      todayAppointments={todayAppointments}
      upcomingAppointments={upcomingAppointments}
      recentPatients={recentPatients}
      activePlans={activePlans}
      apptStatusCounts={apptStatusCounts}
      inactivePatients={inactivePatients}
      allTherapists={allTherapists}
      role={role}
      userName={userName}
      today={today}
    />
  );
}
