import { createClient } from "@/lib/supabase/server";
import { AttendanceClient } from "@/components/attendance/AttendanceClient";
import { getCurrentTherapist } from "@/lib/actions/therapists";

export default async function AttendancePage() {
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);
  // Fetch a 60-day window around today to easily support weekly summaries and daily navigation
  const windowStart = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const windowEnd = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const { isAdmin, therapist } = await getCurrentTherapist();

  let therapistsQuery = supabase.from("therapists").select("id,name,specialty").order("name");

  // If therapist and not admin: strictly only show this particular therapist's attendance
  if (!isAdmin && therapist) {
    therapistsQuery = therapistsQuery.eq("id", therapist.id);
  }

  const [{ data: therapists }, { data: attendanceRecords }] = await Promise.all([
    therapistsQuery,
    supabase
      .from("attendance")
      .select("*")
      .gte("date", windowStart)
      .lte("date", windowEnd),
  ]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-black text-[#1A1A1A]">
          {isAdmin ? "Attendance Management" : "My Attendance"}
        </h2>
        <p className="text-sm text-[#9B9B9B]">
          {isAdmin
            ? "Track and manage clinic doctor daily attendance and hours"
            : "View and log your daily work hours and check-in times"}
        </p>
      </div>
      <AttendanceClient
        therapists={therapists ?? []}
        initialAttendance={attendanceRecords ?? []}
        today={today}
        isTherapist={!isAdmin}
      />
    </div>
  );
}
