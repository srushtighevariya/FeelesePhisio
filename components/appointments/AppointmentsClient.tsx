"use client";

import { useState, useTransition, useEffect } from "react";
import { updateAppointmentStatus, rescheduleAppointment } from "@/lib/actions/appointments";
import { addSession } from "@/lib/actions/sessions";
import { updatePatient } from "@/lib/actions/patients";
import { Check, X, Ban, Calendar, Clock, ArrowRight, FileText, CheckCircle2, Stethoscope, RotateCcw, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { formatTime, formatDate } from "@/lib/utils";

export function AppointmentsClient({ appts }: { appts: any[] }) {
  const [list, setList] = useState(appts);
  const [filter, setFilter] = useState("all");
  const [pending, start] = useTransition();

  // Completion & Feedback modal state
  const [completingAppt, setCompletingAppt] = useState<any | null>(null);
  const [sessionType, setSessionType] = useState("");
  const [painBefore, setPainBefore] = useState<number | "">(6);
  const [painAfter, setPainAfter] = useState<number | "">(3);
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [caseStatus, setCaseStatus] = useState("Ongoing");
  const [completedSuccess, setCompletedSuccess] = useState<{ patientId?: string; patientName?: string } | null>(null);

  // Reschedule modal state
  const [reschedulingAppt, setReschedulingAppt] = useState<any | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("10:00");
  const [rescheduleNotes, setRescheduleNotes] = useState("");
  const [rescheduleError, setRescheduleError] = useState("");
  const [rescheduleSuccess, setRescheduleSuccess] = useState<string | null>(null);

  // Cancel/Missed confirmation state
  const [confirmAction, setConfirmAction] = useState<{ id: string; status: "Cancelled" | "Missed"; patientName: string } | null>(null);


  const filtered = filter === "all" ? list : list.filter((a) => (a.status || "").toLowerCase() === filter.toLowerCase());

  const handleOpenCompleteModal = (appt: any) => {
    setCompletingAppt(appt);
    // Session date is LOCKED to the appointment date — cannot be changed
    setSessionType(appt.type || appt.treatment_type || "Physiotherapy Rehabilitation");
    setPainBefore(6);
    setPainAfter(3);
    setClinicalNotes("");
    setCaseStatus(appt.patients?.status || "Ongoing");
  };

  const handleConfirmCompletion = () => {
    if (!completingAppt) return;
    start(async () => {
      // 1. Update appointment status
      await updateAppointmentStatus(completingAppt.id, "Completed");

      // 2. Log clinical session locked to the appointment date
      if (completingAppt.patients?.id) {
        const apptDate = completingAppt.date
          ? new Date(completingAppt.date).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10);
        await addSession({
          patient_id: completingAppt.patients.id,
          therapist_id: completingAppt.therapist_id,
          date: apptDate,  // Always the appointment date — no manual override
          type: sessionType,
          pain_before: painBefore !== "" ? Number(painBefore) : null,
          pain_after: painAfter !== "" ? Number(painAfter) : null,
          notes: clinicalNotes.trim() || null,
        });

        // 3. Update patient case status if changed
        if (caseStatus) {
          await updatePatient(completingAppt.patients.id, { status: caseStatus });
        }
      }

      setList((prev) => prev.map((a) => (a.id === completingAppt.id ? { ...a, status: "Completed" } : a)));
      setCompletedSuccess({
        patientId: completingAppt.patients?.id,
        patientName: completingAppt.patients?.name || "Patient",
      });
      setCompletingAppt(null);
      setTimeout(() => setCompletedSuccess(null), 8000);
    });
  };

  const changeStatus = (id: string, status: "Completed" | "Missed" | "Cancelled" | "Scheduled") => {
    if (status === "Completed") {
      const appt = list.find((a) => a.id === id);
      if (appt) {
        handleOpenCompleteModal(appt);
        return;
      }
    }
    // Show confirmation dialog for Cancelled and Missed
    if (status === "Cancelled" || status === "Missed") {
      const appt = list.find((a) => a.id === id);
      setConfirmAction({ id, status, patientName: appt?.patients?.name || "this patient" });
      return;
    }
    start(async () => {
      await updateAppointmentStatus(id, status);
      setList((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    });
  };

  const confirmStatusChange = () => {
    if (!confirmAction) return;
    start(async () => {
      await updateAppointmentStatus(confirmAction.id, confirmAction.status);
      setList((prev) => prev.map((a) => (a.id === confirmAction.id ? { ...a, status: confirmAction.status } : a)));
      setConfirmAction(null);
    });
  };

  const handleOpenReschedule = (appt: any) => {
    setReschedulingAppt(appt);
    setRescheduleDate(appt.date ? new Date(appt.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
    setRescheduleTime(appt.time ? appt.time.slice(0, 5) : "10:00");
    setRescheduleNotes("");
    setRescheduleError("");
  };

  const handleConfirmReschedule = () => {
    if (!reschedulingAppt || !rescheduleDate || !rescheduleTime) {
      setRescheduleError("Please select both a date and time slot.");
      return;
    }
    start(async () => {
      try {
        await rescheduleAppointment(
          reschedulingAppt.id,
          rescheduleDate,
          rescheduleTime,
          rescheduleNotes.trim() || undefined
        );
        setList((prev) =>
          prev.map((a) =>
            a.id === reschedulingAppt.id
              ? { ...a, date: rescheduleDate, time: rescheduleTime, status: "Scheduled" }
              : a
          )
        );
        const patientName = reschedulingAppt.patients?.name || "Patient";
        setRescheduleSuccess(`Appointment for ${patientName} rescheduled to ${formatDate(rescheduleDate)} at ${formatTime(rescheduleTime)}.`);
        setReschedulingAppt(null);
        setTimeout(() => setRescheduleSuccess(null), 5000);
      } catch (err: any) {
        setRescheduleError(err?.message || "Failed to reschedule appointment.");
      }
    });
  };

  function renderStatusBadge(status: string) {
    const s = (status || "").toLowerCase();
    if (s === "completed") return <span className="badge-completed">Completed</span>;
    if (s === "cancelled") return <span className="badge-cancelled">Cancelled</span>;
    if (s === "missed") return <span className="badge-missed">Missed</span>;
    return <span className="badge-scheduled">Scheduled</span>;
  }

  return (
    <div className="space-y-4 animate-fade-in pb-20 lg:pb-0">
      {/* Session Feedback Recorded Success Banner */}
      {completedSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-between text-green-800 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-bold">
                Appointment Completed & Session Feedback Saved for {completedSuccess.patientName}!
              </p>
              <p className="text-xs text-green-700">
                Patient rehabilitation progress, pain logs, and recovery status have been updated.
              </p>
            </div>
          </div>
          {completedSuccess.patientId && (
            <Link
              href={`/dashboard/reports/${completedSuccess.patientId}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-pill text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <FileText size={13} />
              View Clinical Report
              <ArrowRight size={13} />
            </Link>
          )}
        </div>
      )}

      {/* Reschedule Success Banner */}
      {rescheduleSuccess && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-2.5 text-blue-800 animate-fade-in">
          <CheckCircle2 size={18} className="text-blue-600 shrink-0" />
          <p className="text-sm font-semibold">{rescheduleSuccess}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1 bg-[#DDD5C7] p-1.5 rounded-pill w-fit">
        {["all", "Scheduled", "Completed", "Missed", "Cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-pill text-xs font-semibold capitalize transition-all cursor-pointer ${
              filter === s
                ? "bg-white text-[#1A1A1A] shadow-card"
                : "text-[#4B4B4B] hover:text-[#1A1A1A]"
            }`}
          >
            {s === "all" ? "All Appointments" : s}
          </button>
        ))}
      </div>

      {/* Appointments Table */}
      <div className="card-white p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Patient</th>
                <th>Physiotherapist</th>
                <th>Treatment Modality</th>
                <th>Status</th>
                <th className="text-right">Update Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                return (
                  <tr key={a.id}>
                    <td className="font-semibold text-[#1A1A1A]">
                      {a.date ? formatDate(a.date) : "—"}
                    </td>
                    <td className="font-semibold text-[#1A1A1A]">
                      {a.time ? formatTime(a.time) : "—"}
                    </td>
                    <td>
                      {a.patients ? (
                        <Link
                          href={`/dashboard/patients/${a.patients.id}`}
                          className="font-semibold text-[#1A1A1A] hover:text-accent transition-colors"
                        >
                          {a.patients.name}
                        </Link>
                      ) : (
                        <span className="text-[#9B9B9B]">Walk-in Patient</span>
                      )}
                    </td>
                    <td>
                      {a.therapists?.name ?? "Assigned Staff"}
                    </td>
                    <td>
                      <span className="text-[#4B4B4B]">
                        {a.type || a.treatment_type || "Physiotherapy Session"}
                      </span>
                    </td>
                    <td>
                      {renderStatusBadge(a.status)}
                    </td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => changeStatus(a.id, "Completed")}
                          disabled={pending}
                          title={a.status === "Completed" ? "Add / Update Session Feedback" : "Complete Session & Give Feedback"}
                          className="w-7 h-7 rounded-pill bg-green-100 text-green-700 hover:bg-green-200 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          onClick={() => changeStatus(a.id, "Missed")}
                          disabled={pending}
                          title="Mark Missed"
                          className="w-7 h-7 rounded-pill bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Ban size={13} />
                        </button>
                        <button
                          onClick={() => changeStatus(a.id, "Cancelled")}
                          disabled={pending}
                          title="Mark Cancelled"
                          className="w-7 h-7 rounded-pill bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                        <button
                          onClick={() => handleOpenReschedule(a)}
                          disabled={pending}
                          title="Reschedule Appointment"
                          className="w-7 h-7 rounded-pill bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <RotateCcw size={13} />
                        </button>
                        {a.patients?.id && (
                          <Link
                            href={`/dashboard/reports/${a.patients.id}`}
                            title="Generate / View Clinical Report"
                            className="w-7 h-7 rounded-pill bg-amber-50 text-amber-800 hover:bg-amber-100 flex items-center justify-center transition-colors ml-1"
                          >
                            <FileText size={13} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!filtered.length && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#9B9B9B]">
                    <Calendar size={28} className="mx-auto text-[#D4CFC6] mb-2" />
                    <p className="font-semibold text-[#1A1A1A] text-sm">No appointments matching this filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Feedback & Case Status Modal */}
      {completingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="card-white max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-xl border border-[#D4CFC6]">
            <div className="flex items-start justify-between border-b border-[#E8E4DB] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Stethoscope className="text-accent" size={20} />
                  <h3 className="text-base font-bold text-[#1A1A1A]">Session Feedback & Clinical Report</h3>
                </div>
                <p className="text-xs text-[#9B9B9B] mt-0.5">
                  Record therapist feedback, pain progress, and update patient case recovery status.
                </p>
              </div>
              <button
                onClick={() => setCompletingAppt(null)}
                className="w-7 h-7 rounded-full text-[#9B9B9B] hover:text-[#1A1A1A] hover:bg-[#F2EFE9] flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Appointment Context — session date locked to appointment date */}
            <div className="p-3 bg-[#F7F5F0] rounded-xl border border-[#E8E4DB]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#9B9B9B]">Patient</p>
                  <p className="text-sm font-bold text-[#1A1A1A]">{completingAppt.patients?.name || "Walk-in Patient"}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#9B9B9B]">Therapist</p>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{completingAppt.therapists?.name || "Attending Physiotherapist"}</p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-[#E8E4DB] flex items-center gap-2">
                <Clock size={12} className="text-accent" />
                <p className="text-xs text-[#4B4B4B]">
                  Session date: <strong className="text-[#1A1A1A]">
                    {completingAppt.date ? new Date(completingAppt.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                  </strong> <span className="text-[#9B9B9B]">(locked to appointment date)</span>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#4B4B4B] mb-1">Patient Recovery Status</label>
                <select
                  value={caseStatus}
                  onChange={(e) => setCaseStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D4CFC6] rounded-xl text-xs font-semibold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  <option value="Ongoing">Ongoing Treatment</option>
                  <option value="Completed">Rehabilitation Completed</option>
                  <option value="Discharged">Discharged (Recovered)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B4B4B] mb-1">Treatment Modality / Exercise</label>
                <input
                  type="text"
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                  placeholder="e.g. Cervical mobilization, Isometric exercises"
                  className="w-full px-3 py-2 bg-white border border-[#D4CFC6] rounded-xl text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>

              {/* VAS Pain Scales */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#F7F5F0] rounded-xl border border-[#E8E4DB]">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#4B4B4B]">Pain Before Session</label>
                    <span className="text-xs font-bold text-red-600">{painBefore !== "" ? `${painBefore}/10` : "—"}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={painBefore === "" ? 5 : painBefore}
                    onChange={(e) => setPainBefore(Number(e.target.value))}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#9B9B9B] mt-0.5">
                    <span>0 (None)</span>
                    <span>10 (Severe)</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-[#4B4B4B]">Pain After Session</label>
                    <span className="text-xs font-bold text-green-600">{painAfter !== "" ? `${painAfter}/10` : "—"}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={painAfter === "" ? 2 : painAfter}
                    onChange={(e) => setPainAfter(Number(e.target.value))}
                    className="w-full accent-green-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#9B9B9B] mt-0.5">
                    <span>0 (None)</span>
                    <span>10 (Severe)</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B4B4B] mb-1">
                  Therapist Feedback & Progress Notes
                </label>
                <textarea
                  rows={3}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Note patient response, range of motion improvements, exercises tolerated, or home care advice..."
                  className="w-full px-3 py-2 bg-white border border-[#D4CFC6] rounded-xl text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E4DB]">
              <button
                type="button"
                onClick={() => setCompletingAppt(null)}
                disabled={pending}
                className="btn-ghost text-xs !py-2 !px-4"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCompletion}
                disabled={pending}
                className="btn-primary text-xs !py-2 !px-4 flex items-center gap-1.5"
              >
                {pending ? (
                  <>Saving Feedback...</>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    Complete & Save Feedback
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel / Missed Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card-white max-w-sm w-full p-6 space-y-4 shadow-xl border border-[#D4CFC6]">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                confirmAction.status === "Cancelled" ? "bg-red-100" : "bg-gray-100"
              }`}>
                {confirmAction.status === "Cancelled" ? (
                  <X size={20} className="text-red-600" />
                ) : (
                  <Ban size={20} className="text-gray-600" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1A1A1A]">
                  {confirmAction.status === "Cancelled" ? "Cancel Appointment?" : "Mark as Missed?"}
                </h3>
                <p className="text-xs text-[#9B9B9B] mt-0.5">
                  For patient: <strong>{confirmAction.patientName}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-[#4B4B4B] bg-[#F7F5F0] p-3 rounded-xl border border-[#E8E4DB]">
              {confirmAction.status === "Cancelled"
                ? "This will mark the appointment as Cancelled. The patient and therapist will be notified. This action can be undone by re-scheduling."
                : "This will mark the appointment as Missed. The session will be logged as not attended."}
            </p>

            <div className="flex gap-2.5">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={pending}
                className="flex-1 btn-secondary text-xs"
              >
                Go Back
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={pending}
                className={`flex-1 text-xs font-semibold py-2.5 px-4 rounded-pill transition-colors cursor-pointer text-white ${
                  confirmAction.status === "Cancelled"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-600 hover:bg-gray-700"
                }`}
              >
                {pending ? "Updating..." : `Yes, Mark ${confirmAction.status}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card-white max-w-md w-full p-6 space-y-4 shadow-xl border border-[#D4CFC6]">
            <div className="flex items-start justify-between border-b border-[#E8E4DB] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                  <RotateCcw size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A1A]">Reschedule Appointment</h3>
                  <p className="text-xs text-[#9B9B9B] mt-0.5">
                    Patient: <strong className="text-[#1A1A1A]">{reschedulingAppt.patients?.name || "Patient"}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReschedulingAppt(null)}
                className="w-7 h-7 rounded-pill hover:bg-[#EDE9E1] flex items-center justify-center text-[#9B9B9B] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {rescheduleError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{rescheduleError}</span>
              </div>
            )}

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#4B4B4B] mb-1">
                  New Appointment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D4CFC6] rounded-xl text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B4B4B] mb-1">
                  New Time Slot <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D4CFC6] rounded-xl text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-accent/30 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4B4B4B] mb-1">
                  Reason / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={rescheduleNotes}
                  onChange={(e) => setRescheduleNotes(e.target.value)}
                  placeholder="e.g. Patient requested morning slot, Doctor emergency rescheduled..."
                  className="w-full px-3 py-2 bg-white border border-[#D4CFC6] rounded-xl text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-[#E8E4DB]">
              <button
                type="button"
                onClick={() => setReschedulingAppt(null)}
                disabled={pending}
                className="flex-1 btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReschedule}
                disabled={pending}
                className="flex-1 btn-primary text-xs flex items-center justify-center gap-1.5"
              >
                {pending ? (
                  "Updating..."
                ) : (
                  <>
                    <RotateCcw size={13} />
                    Confirm Reschedule
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default AppointmentsClient;
