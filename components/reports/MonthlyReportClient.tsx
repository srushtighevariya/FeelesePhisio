"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { getReport, saveReport } from "@/lib/actions/reports";
import { Printer, Check, AlertCircle, Save, Calendar, Stethoscope, Award } from "lucide-react";

interface Props {
  therapists: any[];
  appts: any[];
  attendance: any[];
  isAdmin?: boolean;
}

export function MonthlyReportClient({ therapists, appts, attendance, isAdmin = true }: Props) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedTherapistId, setSelectedTherapistId] = useState(therapists[0]?.id ?? "");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [saved, setSaved] = useState(false);
  const [saving, startSave] = useTransition();
  const [loading, startLoad] = useTransition();

  const [manual, setManual] = useState({
    clinicalLearning: "",
    googleReviews: [{ name: "", date: "" }, { name: "", date: "" }],
    videoPatients: [{ name: "", date: "" }, { name: "", date: "" }],
    extraordinaryWork: "",
    successStories: [{ name: "", caseNo: "" }, { name: "", caseNo: "" }, { name: "", caseNo: "" }],
    remark: "",
  });

  const selectedTherapist = therapists.find((t) => t.id === selectedTherapistId) || therapists[0];
  const monthLabel = selectedMonth
    ? new Date(selectedMonth + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "";

  // Auto-calculated attendance metrics
  const monthAttendance = (attendance || []).filter(
    (a) => a.therapist_id === selectedTherapistId && a.date.startsWith(selectedMonth)
  );
  const workingDays = monthAttendance.filter((a) => a.status === "Present" || a.status === "Half-Day").length;
  const workingHours = parseFloat(
    monthAttendance.reduce((sum, a) => sum + (a.hours_worked || 0), 0).toFixed(1)
  );

  // Completed sessions in the month for this doctor
  const monthAppts = (appts || []).filter(
    (a) => a.therapist_id === selectedTherapistId && a.date.startsWith(selectedMonth) && (a.status === "Completed" || a.status === "completed")
  );
  const noOfFU = monthAppts.length;
  const avgPTsPerDay = workingDays > 0 ? (noOfFU / workingDays).toFixed(1) : "—";
  const avgPTsPerHrs = workingHours > 0 ? (noOfFU / workingHours).toFixed(1) : "—";

  // Load existing saved manual entries
  useEffect(() => {
    if (!selectedTherapistId || !selectedMonth) return;
    startLoad(async () => {
      const data = await getReport(selectedTherapistId, selectedMonth);
      if (data) {
        const d = data as any;
        setManual({
          clinicalLearning: d.clinical_learning ?? "",
          googleReviews: Array.isArray(d.google_reviews_data) ? d.google_reviews_data : (d.google_reviews ?? [{ name: "", date: "" }, { name: "", date: "" }]),
          videoPatients: Array.isArray(d.video_patients_data) ? d.video_patients_data : (d.video_patients ?? [{ name: "", date: "" }, { name: "", date: "" }]),
          extraordinaryWork: d.extraordinary_work ?? "",
          successStories: Array.isArray(d.success_stories_data) ? d.success_stories_data : (d.success_stories ?? [{ name: "", caseNo: "" }, { name: "", caseNo: "" }, { name: "", caseNo: "" }]),
          remark: d.remark ?? "",
        });
      } else {
        setManual({
          clinicalLearning: "",
          googleReviews: [{ name: "", date: "" }, { name: "", date: "" }],
          videoPatients: [{ name: "", date: "" }, { name: "", date: "" }],
          extraordinaryWork: "",
          successStories: [{ name: "", caseNo: "" }, { name: "", caseNo: "" }, { name: "", caseNo: "" }],
          remark: "",
        });
      }
    });
  }, [selectedTherapistId, selectedMonth]);

  const handleSave = () => {
    if (!selectedTherapistId) return;
    startSave(async () => {
      await saveReport({
        therapist_id:       selectedTherapistId,
        month:              selectedMonth,
        working_days:       workingDays,
        working_hours:      workingHours,
        no_of_fu:           noOfFU,
        avg_pts_per_day:    workingDays > 0 ? Number(avgPTsPerDay) : null,
        avg_pts_per_hrs:    workingHours > 0 ? Number(avgPTsPerHrs) : null,
        clinical_learning:  manual.clinicalLearning || null,
        google_reviews:     manual.googleReviews,
        video_patients:     manual.videoPatients,
        extraordinary_work: manual.extraordinaryWork || null,
        success_stories:    manual.successStories,
        remark:             manual.remark || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="heading-md">
            {isAdmin ? "Staff Monthly Performance Report" : "My Performance Report"}
          </h2>
          <p className="body-sm mt-0.5">
            {isAdmin
              ? "Doctor monthly clinical reviews, follow-up metrics, and case learnings."
              : "Your verified clinical reviews, patient follow-up volume, and monthly learnings."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-secondary text-xs"
          >
            {saved ? <><Check size={14} className="text-green-600" /> Saved!</> : <><Save size={14} /> Save Report</>}
          </button>
          <button
            onClick={() => window.print()}
            className="btn-primary text-xs"
          >
            <Printer size={15} /> Print Official Report
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="card-white p-5 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">
              {isAdmin ? "Select Physiotherapist" : "Attending Physiotherapist"}
            </label>
            {isAdmin ? (
              <select
                value={selectedTherapistId}
                onChange={(e) => setSelectedTherapistId(e.target.value)}
                className="input-base cursor-pointer"
              >
                {therapists.map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.specialty || "Physiotherapist"})</option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-[#F7F5F0] border border-[#D4CFC6] rounded-xl">
                <Stethoscope size={16} className="text-accent shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#1A1A1A] truncate">{selectedTherapist?.name || "Attending Doctor"}</p>
                  <p className="text-[11px] text-[#9B9B9B] truncate">{selectedTherapist?.specialty || "Physiotherapist"}</p>
                </div>
                <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full ml-auto shrink-0">
                  Your Account
                </span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">Reporting Month / Year</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input-base cursor-pointer"
            />
          </div>
        </div>

        {workingDays === 0 && selectedTherapistId && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0 text-amber-600" />
            No attendance records marked for this month yet. Mark daily attendance on the <b>Attendance</b> tab — hours and days will auto-calculate here.
          </div>
        )}
      </div>

      {/* Official Printable Report Card */}
      {selectedTherapistId && (
        <div className="card-white p-0 overflow-hidden shadow-panel print:shadow-none print:border print:rounded-none">
          {/* Header Banner */}
          <div className="bg-dark text-white text-center py-6 px-6">
            <div className="text-xl font-bold tracking-widest uppercase">FEEL EASE PHYSIOTHERAPY</div>
            <div className="text-xs font-semibold mt-1.5 tracking-[0.2em] uppercase text-white/60">
              Staff Monthly Performance & Case Report
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Top Metadata Grid */}
            <div className="border border-[#D4CFC6] rounded-2xl overflow-hidden">
              <div className="grid grid-cols-3 border-b border-[#D4CFC6] bg-[#EDE9E1]/30">
                <div className="p-3.5 border-r border-[#D4CFC6]">
                  <div className="text-[10px] font-bold text-[#9B9B9B] uppercase tracking-wider mb-1">Month / Year</div>
                  <div className="font-bold text-[#1A1A1A] text-sm">{monthLabel}</div>
                </div>
                <div className="p-3.5 border-r border-[#D4CFC6]">
                  <div className="text-[10px] font-bold text-[#9B9B9B] uppercase tracking-wider mb-1">Name of Doctor</div>
                  <div className="font-bold text-[#1A1A1A] text-sm">{selectedTherapist?.name || "—"}</div>
                </div>
                <div className="p-3.5">
                  <div className="text-[10px] font-bold text-[#9B9B9B] uppercase tracking-wider mb-1">Signature</div>
                  <div className="text-[#9B9B9B] italic text-sm">_____________________</div>
                </div>
              </div>

              {/* Auto-filled stats */}
              {[
                { label: "Working Days", value: workingDays || "—", hint: workingDays === 0 },
                { label: "Working Hours", value: workingHours > 0 ? `${workingHours} hrs` : "—", hint: workingHours === 0 },
                { label: "No. of Follow-up Sessions (F/U)", value: noOfFU || "—", hint: false },
                { label: "Average PTs / Day", value: avgPTsPerDay, hint: false },
                { label: "Average PTs / Hour", value: avgPTsPerHrs, hint: false },
              ].map((row, i, arr) => (
                <div key={i} className={`grid grid-cols-2 ${i < arr.length - 1 ? "border-b border-[#E8E4DB]" : ""}`}>
                  <div className="p-3 border-r border-[#D4CFC6] bg-[#EDE9E1]/40 text-xs font-semibold text-[#4B4B4B]">
                    {row.label}
                  </div>
                  <div className="p-3 flex items-center gap-2 text-xs font-bold text-[#1A1A1A]">
                    <span>{row.value}</span>
                    {row.hint && (
                      <span className="text-[10px] text-amber-600 font-medium italic no-print">
                        ← mark daily attendance to populate
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Clinical Learning Section */}
            <div className="border border-[#D4CFC6] rounded-2xl overflow-hidden">
              <div className="p-3 bg-[#EDE9E1]/50 border-b border-[#D4CFC6] text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                Clinical Learning & Case Insights
              </div>
              <textarea
                value={manual.clinicalLearning}
                onChange={(e) => setManual({ ...manual, clinicalLearning: e.target.value })}
                rows={3}
                placeholder="Document clinical skills developed, diagnostic advancements, or therapeutic techniques applied this month…"
                className="w-full p-4 text-xs text-[#1A1A1A] bg-transparent focus:outline-none focus:bg-[#EDE9E1]/20 resize-none placeholder:text-[#9B9B9B]"
              />
            </div>

            {/* Google Reviews & Video Testimonials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-[#D4CFC6] rounded-2xl overflow-hidden">
                <div className="p-3 bg-[#EDE9E1]/50 border-b border-[#D4CFC6] text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                  Google Patient Reviews
                </div>
                <div className="divide-y divide-[#E8E4DB]">
                  {manual.googleReviews.map((r, i) => (
                    <div key={i} className="grid grid-cols-2">
                      <input
                        value={r.name}
                        onChange={(e) => {
                          const updated = [...manual.googleReviews];
                          updated[i].name = e.target.value;
                          setManual({ ...manual, googleReviews: updated });
                        }}
                        placeholder="Patient Name"
                        className="p-3 text-xs text-[#1A1A1A] bg-transparent focus:outline-none border-r border-[#E8E4DB] placeholder:text-[#9B9B9B]"
                      />
                      <input
                        value={r.date}
                        onChange={(e) => {
                          const updated = [...manual.googleReviews];
                          updated[i].date = e.target.value;
                          setManual({ ...manual, googleReviews: updated });
                        }}
                        placeholder="Review Date"
                        className="p-3 text-xs text-[#1A1A1A] bg-transparent focus:outline-none placeholder:text-[#9B9B9B]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-[#D4CFC6] rounded-2xl overflow-hidden">
                <div className="p-3 bg-[#EDE9E1]/50 border-b border-[#D4CFC6] text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                  Video Testimonials Recorded
                </div>
                <div className="divide-y divide-[#E8E4DB]">
                  {manual.videoPatients.map((v, i) => (
                    <div key={i} className="grid grid-cols-2">
                      <input
                        value={v.name}
                        onChange={(e) => {
                          const updated = [...manual.videoPatients];
                          updated[i].name = e.target.value;
                          setManual({ ...manual, videoPatients: updated });
                        }}
                        placeholder="Patient Name"
                        className="p-3 text-xs text-[#1A1A1A] bg-transparent focus:outline-none border-r border-[#E8E4DB] placeholder:text-[#9B9B9B]"
                      />
                      <input
                        value={v.date}
                        onChange={(e) => {
                          const updated = [...manual.videoPatients];
                          updated[i].date = e.target.value;
                          setManual({ ...manual, videoPatients: updated });
                        }}
                        placeholder="Date"
                        className="p-3 text-xs text-[#1A1A1A] bg-transparent focus:outline-none placeholder:text-[#9B9B9B]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Remark */}
            <div className="border border-[#D4CFC6] rounded-2xl overflow-hidden">
              <div className="p-3 bg-[#EDE9E1]/50 border-b border-[#D4CFC6] text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                Clinical Director Remarks
              </div>
              <textarea
                value={manual.remark}
                onChange={(e) => setManual({ ...manual, remark: e.target.value })}
                rows={2}
                placeholder="Supervisor feedback, commendations, or clinical goals for next month…"
                className="w-full p-4 text-xs text-[#1A1A1A] bg-transparent focus:outline-none focus:bg-[#EDE9E1]/20 resize-none placeholder:text-[#9B9B9B]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default MonthlyReportClient;
