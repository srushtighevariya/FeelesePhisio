"use client";

import { useState, useTransition } from "react";
import { upsertAttendance } from "@/lib/actions/attendance";
import { calcHours } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Check, Calendar, Save, ClipboardCheck, Clock } from "lucide-react";

const TABS = ["Daily Log", "Staff Monthly Summary"] as const;
type Tab = typeof TABS[number];

const STATUS_OPTS = ["Present", "Half-Day", "Leave", "Absent"] as const;
type AttStatus = typeof STATUS_OPTS[number];

interface Therapist { id: string; name: string; specialty: string | null }
interface AttRecord { id?: string; therapist_id: string; date: string; check_in: string | null; check_out: string | null; status: AttStatus; hours_worked: number | null; notes: string | null }

interface Props {
  therapists: Therapist[];
  initialAttendance: AttRecord[];
  today: string;
  isTherapist?: boolean;
}

const normalizeDate = (d: string | Date | null | undefined): string => {
  if (!d) return "";
  if (typeof d === "string") return d.slice(0, 10);
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

export function AttendanceClient({ therapists, initialAttendance, today, isTherapist = false }: Props) {
  const tabs = isTherapist ? (["My Daily Log", "My Weekly Summary"] as const) : (["Daily Log", "Staff Weekly Summary"] as const);
  const [tab, setTab] = useState<string>(tabs[0]);
  const [date, setDate] = useState(today);
  const [attendance, setAttendance] = useState<AttRecord[]>(initialAttendance);
  const [loading, setLoading] = useState(false);
  const [pending, start] = useTransition();
  const [savedRow, setSavedRow] = useState<string | null>(null);

  const rows = therapists.map((t) => {
    const rec = attendance.find(
      (a) => a.therapist_id === t.id && normalizeDate(a.date) === date
    );
    const status = (rec?.status ?? "Present") as AttStatus;
    const isOff = status === "Leave" || status === "Absent";
    return {
      therapist:  t,
      status,
      check_in:   isOff ? "" : (rec?.check_in ? rec.check_in.slice(0, 5) : "09:00"),
      check_out:  isOff ? "" : (rec?.check_out ? rec.check_out.slice(0, 5) : "17:30"),
      notes:      rec?.notes     ?? "",
    };
  });

  const loadDate = async (d: string) => {
    setDate(d);
    setLoading(true);
    const supabase = createClient();
    const month = d.slice(0, 7);
    const { data } = await supabase
      .from("attendance")
      .select("*")
      .gte("date", `${month}-01`)
      .lte("date", `${month}-31`);
    if (data) {
      setAttendance(data as AttRecord[]);
    }
    setLoading(false);
  };

  const mark = (therapistId: string, field: string, value: string) => {
    setAttendance((prev) => {
      const exists = prev.find(
        (a) => a.therapist_id === therapistId && normalizeDate(a.date) === date
      );
      if (field === "status") {
        const isOff = value === "Leave" || value === "Absent";
        const newCheckIn = isOff ? null : (value === "Half-Day" ? "09:00" : (exists?.check_in ? exists.check_in.slice(0, 5) : "09:00"));
        const newCheckOut = isOff ? null : (value === "Half-Day" ? "13:00" : (exists?.check_out ? exists.check_out.slice(0, 5) : "17:30"));
        const newHours = isOff ? 0 : (newCheckIn && newCheckOut ? calcHours(newCheckIn, newCheckOut) : (value === "Half-Day" ? 4.0 : 8.5));

        if (exists) {
          return prev.map((a) =>
            a.therapist_id === therapistId && normalizeDate(a.date) === date
              ? { ...a, status: value as AttStatus, check_in: newCheckIn, check_out: newCheckOut, hours_worked: newHours }
              : a
          );
        }
        return [...prev, { therapist_id: therapistId, date, status: value as AttStatus, check_in: newCheckIn, check_out: newCheckOut, hours_worked: newHours, notes: null }];
      }

      if (exists) {
        return prev.map((a) =>
          a.therapist_id === therapistId && normalizeDate(a.date) === date
            ? { ...a, [field]: value }
            : a
        );
      }
      return [...prev, { therapist_id: therapistId, date, status: "Present", check_in: "09:00", check_out: "17:30", hours_worked: 8.5, notes: null, [field]: value }];
    });
  };

  const save = (therapistId: string) => {
    const rec = attendance.find(
      (a) => a.therapist_id === therapistId && normalizeDate(a.date) === date
    );
    const status = (rec?.status ?? "Present") as AttStatus;
    const isOff = status === "Leave" || status === "Absent";
    const checkIn = isOff ? null : (rec?.check_in ? rec.check_in.slice(0, 5) : "09:00");
    const checkOut = isOff ? null : (rec?.check_out ? rec.check_out.slice(0, 5) : "17:30");
    const hours = isOff ? 0 : (checkIn && checkOut ? calcHours(checkIn, checkOut) : (status === "Half-Day" ? 4.0 : 8.5));
    start(async () => {
      await upsertAttendance({
        therapist_id: therapistId,
        date,
        status,
        check_in:     checkIn,
        check_out:    checkOut,
        hours_worked: hours,
        notes:        rec?.notes ?? null,
      });

      // Update local state so monthly summary tab reflects it immediately
      setAttendance((prev) => {
        const filtered = prev.filter(
          (a) => !(a.therapist_id === therapistId && normalizeDate(a.date) === date)
        );
        return [
          ...filtered,
          {
            therapist_id: therapistId,
            date,
            status,
            check_in: checkIn,
            check_out: checkOut,
            hours_worked: hours,
            notes: rec?.notes ?? null,
          },
        ];
      });

      setSavedRow(therapistId);
      setTimeout(() => setSavedRow(null), 2000);
    });
  };

  // Calculate weekly range (Monday to Sunday) based on selected date
  const getWeekRange = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const curr = new Date(y, m - 1, d);
    const day = curr.getDay(); // 0 is Sunday, 1 is Monday...
    const diffToMonday = curr.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(curr.setDate(diffToMonday));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const toISOStr = (dt: Date) => {
      const year = dt.getFullYear();
      const month = String(dt.getMonth() + 1).padStart(2, "0");
      const dateNum = String(dt.getDate()).padStart(2, "0");
      return `${year}-${month}-${dateNum}`;
    };
    return {
      startStr: toISOStr(monday),
      endStr: toISOStr(sunday),
      label: `${monday.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} – ${sunday.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`,
    };
  };

  const activeWeek = getWeekRange(date);

  // Summary stats for the active week
  const summary = therapists.map((t) => {
    const recs = attendance.filter((a) => {
      const dStr = normalizeDate(a.date);
      return a.therapist_id === t.id && dStr >= activeWeek.startStr && dStr <= activeWeek.endStr;
    });
    return {
      id:       t.id,
      name:     t.name,
      present:  recs.filter((a) => (a.status || "").toLowerCase() === "present").length,
      halfDay:  recs.filter((a) => (a.status || "").toLowerCase() === "half-day").length,
      leave:    recs.filter((a) => ["leave", "absent"].includes((a.status || "").toLowerCase())).length,
      totalHrs: recs.reduce((s, a) => {
        const st = (a.status || "").toLowerCase();
        if (st === "leave" || st === "absent") return s;
        const h = Number(a.hours_worked);
        if (!isNaN(h) && h > 0) return s + h;
        if (a.check_in && a.check_out) {
          const calc = calcHours(a.check_in.slice(0, 5), a.check_out.slice(0, 5));
          if (calc > 0) return s + calc;
        }
        return s + (st === "half-day" ? 4.0 : 8.5);
      }, 0).toFixed(1),
    };
  });

  const isDailyTab = tab === tabs[0];

  return (
    <div className="space-y-6 animate-fade-in pb-20 lg:pb-0">
      {/* Controls Bar */}
      <div className="card-white p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1 bg-[#DDD5C7] p-1.5 rounded-pill">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-pill text-xs font-semibold transition-all cursor-pointer ${
                tab === t
                  ? "bg-white text-[#1A1A1A] shadow-card"
                  : "text-[#4B4B4B] hover:text-[#1A1A1A]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {isDailyTab ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[#4B4B4B]">Log Date:</span>
            <input
              type="date"
              value={date}
              onChange={(e) => loadDate(e.target.value)}
              className="px-3.5 py-1.5 bg-white border border-[#D4CFC6] rounded-pill text-xs text-[#1A1A1A] font-semibold focus:outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer"
            />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[#4B4B4B]">Reporting Week:</span>
            <span className="px-3.5 py-1.5 bg-[#EDE9E1] border border-[#D4CFC6] rounded-pill text-xs text-[#1A1A1A] font-bold">
              {activeWeek.label}
            </span>
          </div>
        )}
      </div>

      {isDailyTab ? (
        <div className="card-white p-0 overflow-hidden">
          {/* Read-only notice for therapists */}
          {isTherapist && (
            <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
              <span className="text-xs text-amber-700 font-medium">
                📋 Your attendance log is managed by the clinic admin. Please contact admin if there are any discrepancies.
              </span>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Doctor / Staff</th>
                  <th>Attendance Status</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours Worked</th>
                  <th>Notes</th>
                  {!isTherapist && <th className="text-right">Action</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ therapist, status, check_in, check_out, notes }) => {
                  const isOff = status === "Leave" || status === "Absent";
                  const hours = isOff ? 0 : (check_in && check_out ? calcHours(check_in, check_out) : null);
                  const isSaved = savedRow === therapist.id;

                  // Status badge color for read-only display
                  const statusBadgeClass = {
                    "Present": "bg-green-50 text-green-700 border-green-200",
                    "Half-Day": "bg-yellow-50 text-yellow-700 border-yellow-200",
                    "Leave": "bg-blue-50 text-blue-700 border-blue-200",
                    "Absent": "bg-red-50 text-red-700 border-red-200",
                  }[status] ?? "bg-gray-50 text-gray-700 border-gray-200";

                  return (
                    <tr key={therapist.id} className={isOff ? "opacity-75 bg-slate-50/50" : ""}>
                      <td>
                        <div className="font-semibold text-[#1A1A1A] text-sm">{therapist.name}</div>
                        <div className="text-xs text-[#9B9B9B]">{therapist.specialty || "Physiotherapist"}</div>
                      </td>
                      <td>
                        {isTherapist ? (
                          // Read-only badge for therapist
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadgeClass}`}>
                            {status}
                          </span>
                        ) : (
                          <select
                            value={status}
                            onChange={(e) => mark(therapist.id, "status", e.target.value)}
                            className="px-3 py-1.5 bg-white border border-[#D4CFC6] rounded-pill text-xs font-semibold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer"
                          >
                            {STATUS_OPTS.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td>
                        {isOff ? (
                          <span className="text-xs text-[#9B9B9B] font-mono px-3">—</span>
                        ) : isTherapist ? (
                          <span className="text-xs text-[#1A1A1A] font-mono">{check_in || "—"}</span>
                        ) : (
                          <input
                            type="time"
                            value={check_in}
                            onChange={(e) => mark(therapist.id, "check_in", e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-[#D4CFC6] rounded-pill text-xs text-[#1A1A1A] font-mono focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        )}
                      </td>
                      <td>
                        {isOff ? (
                          <span className="text-xs text-[#9B9B9B] font-mono px-3">—</span>
                        ) : isTherapist ? (
                          <span className="text-xs text-[#1A1A1A] font-mono">{check_out || "—"}</span>
                        ) : (
                          <input
                            type="time"
                            value={check_out}
                            onChange={(e) => mark(therapist.id, "check_out", e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-[#D4CFC6] rounded-pill text-xs text-[#1A1A1A] font-mono focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        )}
                      </td>
                      <td>
                        {isOff ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                            0.0 hrs
                          </span>
                        ) : (
                          <span className="font-semibold text-[#1A1A1A] text-xs">
                            {hours !== null ? `${hours} hrs` : "—"}
                          </span>
                        )}
                      </td>
                      <td>
                        {isTherapist ? (
                          <span className="text-xs text-[#9B9B9B] italic">{notes || "—"}</span>
                        ) : (
                          <input
                            type="text"
                            value={notes}
                            onChange={(e) => mark(therapist.id, "notes", e.target.value)}
                            placeholder="Optional notes…"
                            className="w-full px-3 py-1.5 bg-white border border-[#D4CFC6] rounded-pill text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        )}
                      </td>
                      {!isTherapist && (
                        <td className="text-right">
                          <button
                            onClick={() => save(therapist.id)}
                            disabled={pending}
                            className={`btn-primary text-xs !py-1.5 !px-3 ${
                              isSaved ? "!bg-green-600 hover:!bg-green-700" : ""
                            }`}
                          >
                            {isSaved ? (
                              <><Check size={13} /> Saved</>
                            ) : (
                              <><Save size={13} /> Save Log</>
                            )}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Staff Monthly Summary */
        <div className="card-white p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Doctor / Staff</th>
                  <th>Days Present</th>
                  <th>Half Days</th>
                  <th>Leaves</th>
                  <th className="text-right">Total Hours</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s) => (
                  <tr key={s.id}>
                    <td className="font-semibold text-[#1A1A1A]">{s.name}</td>
                    <td>
                      <span className="badge-completed">{s.present} Days</span>
                    </td>
                    <td>
                      <span className="badge-scheduled">{s.halfDay} Days</span>
                    </td>
                    <td>
                      <span className="badge-missed">{s.leave} Days</span>
                    </td>
                    <td className="text-right font-bold text-[#1A1A1A]">
                      {s.totalHrs} hrs
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
export default AttendanceClient;
