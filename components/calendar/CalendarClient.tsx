"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  addWeeks,
  subWeeks,
  parseISO,
  isSameDay,
  addDays,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, AlertTriangle, X, Ban } from "lucide-react";
import { formatTime, cn } from "@/lib/utils";
import { updateAppointmentStatus } from "@/lib/actions/appointments";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Appointment = any;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-yellow-50 border-yellow-200 text-yellow-800",
  completed: "bg-green-50 border-green-200 text-green-800",
  cancelled: "bg-red-50 border-red-200 text-red-700 line-through opacity-70",
  missed: "bg-gray-50 border-gray-200 text-gray-500",
};

const STATUS_DOT: Record<string, string> = {
  scheduled: "bg-yellow-400",
  completed: "bg-green-500",
  cancelled: "bg-red-400",
  missed: "bg-gray-400",
};

export function CalendarClient({
  appointments,
  weekStart,
}: {
  appointments: Appointment[];
  weekStart: string;
}) {
  const router = useRouter();
  const currentWeekStart = parseISO(weekStart);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    status: "Completed" | "Missed" | "Cancelled" | "Scheduled";
    patientName: string;
  } | null>(null);
  const [updating, setUpdating] = useState(false);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function navigate(dir: "prev" | "next") {
    const next =
      dir === "next"
        ? addWeeks(currentWeekStart, 1)
        : subWeeks(currentWeekStart, 1);
    router.push(`/dashboard/calendar?week=${format(next, "yyyy-MM-dd")}`);
  }

  async function changeStatus(id: string, status: "Completed" | "Missed" | "Cancelled" | "Scheduled") {
    try {
      setUpdating(true);
      await updateAppointmentStatus(id, status);
      showToast(`Marked as ${status}.`);
      setSelected(null);
      setConfirmAction(null);
      router.refresh();
    } catch {
      showToast("Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  function appointmentsForDay(day: Date) {
    return appointments.filter((a) => {
      try {
        return isSameDay(parseISO(a.date), day);
      } catch {
        return false;
      }
    });
  }

  return (
    <div className="space-y-5 animate-fade-in pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="heading-lg">Clinic Calendar</h1>
          <p className="body-sm mt-0.5">
            Week of {format(currentWeekStart, "d MMM")} –{" "}
            {format(addDays(currentWeekStart, 6), "d MMM yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("prev")}
            className="btn-secondary p-2"
            title="Previous week"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => router.push("/dashboard/calendar")}
            className="btn-secondary text-xs px-3.5 py-2"
          >
            This Week
          </button>
          <button
            onClick={() => navigate("next")}
            className="btn-secondary p-2"
            title="Next week"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="bg-dark text-white text-sm px-4 py-3 rounded-pill shadow-panel animate-fade-in inline-block">
          {toast}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {Object.entries(STATUS_DOT).map(([status, dotCls]) => (
          <div key={status} className="flex items-center gap-1.5 text-xs text-[#4B4B4B] capitalize font-medium">
            <span className={cn("w-2 h-2 rounded-full", dotCls)} />
            {status}
          </div>
        ))}
      </div>

      {/* Weekly grid */}
      <div className="card-white overflow-hidden p-0">
        <div className="grid grid-cols-7 border-b border-[#E8E4DB]">
          {weekDays.map((day, i) => (
            <div
              key={i}
              className={cn(
                "px-2 py-3 text-center border-r border-[#E8E4DB] last:border-r-0",
                isToday(day) && "bg-accent/10"
              )}
            >
              <p className="text-xs font-semibold text-[#9B9B9B] uppercase tracking-wider">{DAYS[i]}</p>
              <p
                className={cn(
                  "text-sm font-bold mt-1",
                  isToday(day)
                    ? "w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center mx-auto shadow-sm"
                    : "text-[#1A1A1A]"
                )}
              >
                {format(day, "d")}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 min-h-[420px]">
          {weekDays.map((day, i) => {
            const dayAppts = appointmentsForDay(day);
            return (
              <div
                key={i}
                className={cn(
                  "border-r border-[#E8E4DB] last:border-r-0 p-2 space-y-1.5 min-h-[160px]",
                  isToday(day) && "bg-accent/5"
                )}
              >
                {dayAppts.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <span className="text-xs text-[#D4CFC6]">—</span>
                  </div>
                ) : (
                  dayAppts.map((a) => {
                    const norm = (a.status || "scheduled").toLowerCase();
                    return (
                      <button
                        key={a.id}
                        onClick={() => setSelected(a)}
                        className={cn(
                          "w-full text-left text-[11px] border rounded-xl px-2.5 py-2 transition-all hover:shadow-sm hover:scale-[1.02] cursor-pointer",
                          STATUS_COLORS[norm] ?? STATUS_COLORS.scheduled
                        )}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", STATUS_DOT[norm] ?? "bg-gray-400")} />
                          <span className="font-bold truncate">{formatTime(a.time)}</span>
                        </div>
                        <p className="truncate font-semibold text-[#1A1A1A]">{a.patients?.name ?? "Patient"}</p>
                        <p className="truncate opacity-70 text-[10px]">{a.type || a.treatment_type || "Physiotherapy"}</p>
                      </button>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Appointment detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/40 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="card-white shadow-panel max-w-md w-full p-6 space-y-5 animate-fade-in border border-[#D4CFC6]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Status badge */}
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold text-[#1A1A1A] text-lg">{selected.patients?.name ?? "Patient"}</p>
                <p className="text-xs text-[#9B9B9B] mt-0.5">{selected.patients?.phone || "No phone recorded"}</p>
              </div>
              <span
                className={cn(
                  "text-xs font-semibold px-2.5 py-1 rounded-pill border capitalize",
                  STATUS_COLORS[(selected.status || "").toLowerCase()] ?? STATUS_COLORS.scheduled
                )}
              >
                {selected.status}
              </span>
            </div>

            <div className="space-y-2.5 text-xs bg-[#EDE9E1]/50 p-3.5 rounded-2xl border border-[#D4CFC6]/60">
              <div className="flex justify-between text-[#4B4B4B]">
                <span>Date</span>
                <span className="font-semibold text-[#1A1A1A]">
                  {format(parseISO(selected.date), "EEEE, d MMM yyyy")}
                </span>
              </div>
              <div className="flex justify-between text-[#4B4B4B]">
                <span>Time Slot</span>
                <span className="font-semibold text-[#1A1A1A]">{formatTime(selected.time)}</span>
              </div>
              <div className="flex justify-between text-[#4B4B4B]">
                <span>Treatment Modality</span>
                <span className="font-semibold text-[#1A1A1A]">{selected.type || selected.treatment_type || "Physiotherapy"}</span>
              </div>
              <div className="flex justify-between text-[#4B4B4B]">
                <span>Attending Doctor</span>
                <span className="font-semibold text-[#1A1A1A]">{selected.therapists?.name ?? "—"}</span>
              </div>
            </div>

            {/* Quick status actions */}
            {(selected.status || "").toLowerCase() === "scheduled" ? (
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => changeStatus(selected.id, "Completed")}
                  className="btn-secondary text-xs !text-green-700 !border-green-200 hover:!bg-green-50 !py-2"
                >
                  ✓ Complete
                </button>
                <button
                  onClick={() =>
                    setConfirmAction({
                      id: selected.id,
                      status: "Cancelled",
                      patientName: selected.patients?.name ?? "Patient",
                    })
                  }
                  className="btn-secondary text-xs !text-red-600 !border-red-200 hover:!bg-red-50 !py-2"
                >
                  ✕ Cancel
                </button>
                <button
                  onClick={() =>
                    setConfirmAction({
                      id: selected.id,
                      status: "Missed",
                      patientName: selected.patients?.name ?? "Patient",
                    })
                  }
                  className="btn-secondary text-xs !text-gray-600 !py-2"
                >
                  Missed
                </button>
              </div>
            ) : (
              <button
                onClick={() => changeStatus(selected.id, "Scheduled")}
                className="btn-secondary w-full text-xs !py-2"
              >
                Reopen Appointment
              </button>
            )}

            <button
              onClick={() => setSelected(null)}
              className="btn-ghost w-full text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Cancel or Missed appointment */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card-white max-w-sm w-full p-6 space-y-4 shadow-xl border border-[#D4CFC6]">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                confirmAction.status === "Cancelled" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"
              }`}>
                {confirmAction.status === "Cancelled" ? <AlertTriangle size={20} /> : <Ban size={20} />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1A1A1A]">
                  {confirmAction.status === "Cancelled" ? "Confirm Cancel Session?" : "Mark as Missed?"}
                </h3>
                <p className="text-xs text-[#9B9B9B] mt-0.5">
                  Patient: <strong>{confirmAction.patientName}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-[#4B4B4B] bg-[#F7F5F0] p-3 rounded-xl border border-[#E8E4DB]">
              {confirmAction.status === "Cancelled"
                ? "Are you sure you want to cancel this appointment? The patient and attending therapist schedule will be updated."
                : "Are you sure you want to mark this appointment as missed?"}
            </p>

            <div className="flex gap-2.5">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={updating}
                className="flex-1 btn-secondary text-xs"
              >
                Go Back
              </button>
              <button
                onClick={() => changeStatus(confirmAction.id, confirmAction.status)}
                disabled={updating}
                className={`flex-1 text-xs font-semibold py-2.5 px-4 rounded-pill transition-colors cursor-pointer text-white ${
                  confirmAction.status === "Cancelled"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-600 hover:bg-gray-700"
                }`}
              >
                {updating ? "Updating..." : `Yes, ${confirmAction.status}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default CalendarClient;
