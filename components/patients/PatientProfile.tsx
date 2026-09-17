"use client";

import { useState, useTransition } from "react";
import { upsertAssessment } from "@/lib/actions/assessments";
import { upsertPlan } from "@/lib/actions/plans";
import { addSession } from "@/lib/actions/sessions";
import { updatePatient } from "@/lib/actions/patients";
import {
  Printer, Plus, Activity, Calendar, FileText, Check, ArrowLeft,
  X, Shield, HeartPulse, Sparkles, TrendingDown, Clock, Award, UserCheck
} from "lucide-react";
import Link from "next/link";

const TABS = ["Overview", "Clinical Assessment", "Treatment Plan", "Session History"] as const;
type Tab = typeof TABS[number];

interface Props {
  patient: any;
  sessions: any[];
  assessment: any;
  plan: any;
  therapists?: any[];
  isAdmin?: boolean;
}

export function PatientProfileClient({ patient, sessions, assessment, plan, therapists = [], isAdmin = false }: Props) {
  const [tab, setTab] = useState<Tab>("Overview");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [assigningDoctor, setAssigningDoctor] = useState(false);
  const [selectedTherapistId, setSelectedTherapistId] = useState(patient.therapist_id || "");
  const [isUpdatingDoctor, startDoctorTransition] = useTransition();

  // Calculations for growth certificate based on REAL recorded sessions
  const sortedSessions = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const sessionsWithPain = sortedSessions.filter((s) => s.pain_before != null || s.pain_after != null);
  const hasSessions = sessionsWithPain.length > 0;

  const initialPain = hasSessions && sortedSessions[0].pain_before != null
    ? sortedSessions[0].pain_before
    : (hasSessions && sortedSessions[0].pain_after != null ? sortedSessions[0].pain_after : null);

  const currentPain = hasSessions && sortedSessions[sortedSessions.length - 1].pain_after != null
    ? sortedSessions[sortedSessions.length - 1].pain_after
    : (hasSessions ? sortedSessions[sortedSessions.length - 1].pain_before : null);

  const reliefPoints = initialPain != null && currentPain != null ? Math.max(0, initialPain - currentPain) : 0;
  const pctRelief = initialPain != null && initialPain > 0 ? Math.round((reliefPoints / initialPain) * 100) : 0;
  const plannedSessions = plan?.items?.length ? plan.items.length * 3 : 10;
  const progressPct = Math.min(Math.round((sessions.length / plannedSessions) * 100), 100);

  const currentTherapist = therapists.find((t) => t.id === (patient.therapist_id || (patient.therapists as any)?.id));
  const docName = (patient.therapists as any)?.name ?? currentTherapist?.name ?? "Attending Physiotherapist";
  const docSpecialty = (patient.therapists as any)?.specialty ?? currentTherapist?.specialty ?? "Physical Therapist";

  const handleAssignDoctor = (thId: string) => {
    setSelectedTherapistId(thId);
    startDoctorTransition(async () => {
      await updatePatient(patient.id, { therapist_id: thId || null });
      setAssigningDoctor(false);
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/dashboard/patients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Patients
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setReportModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Printer size={15} className="text-teal-600" />
            {isAdmin ? "View Growth Report" : "Print Clinical Report"}
          </button>
        </div>
      </div>

      {/* Header Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700 font-bold text-xl shrink-0">
              {patient.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-display font-bold text-slate-900">{patient.name}</h1>
                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                  {patient.code || `PT-${patient.id.slice(0, 5)}`}
                </span>
                <StatusChip status={patient.status || "Ongoing"} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {patient.gender || "Gender unassigned"} · {patient.age ? `${patient.age} yrs` : "Age N/A"} · {patient.occupation || "Patient"}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                {isAdmin ? (
                  assigningDoctor ? (
                    <div className="flex items-center gap-1.5 bg-white border border-teal-300 p-1 rounded-xl shadow-sm">
                      <select
                        value={selectedTherapistId}
                        onChange={(e) => handleAssignDoctor(e.target.value)}
                        disabled={isUpdatingDoctor}
                        className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none cursor-pointer text-slate-800 font-medium"
                      >
                        <option value="">Unassigned</option>
                        {therapists.map((t) => (
                          <option key={t.id} value={t.id}>{t.name} ({t.specialty || "Physio"})</option>
                        ))}
                      </select>
                      <button
                        onClick={() => setAssigningDoctor(false)}
                        className="text-[11px] text-slate-400 hover:text-slate-600 px-1"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAssigningDoctor(true)}
                      className="inline-flex items-center gap-1.5 text-teal-700 font-semibold bg-teal-50 hover:bg-teal-100/80 border border-teal-200/60 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      title="Admin: Click to reassign attending doctor"
                    >
                      <Activity size={12} /> {patient.therapist_id || (patient.therapists as any)?.name ? `${docName} (${docSpecialty})` : "Assign Attending Doctor +"}
                    </button>
                  )
                ) : (
                  <div className="inline-flex items-center gap-1.5 text-teal-800 font-semibold bg-teal-50 border border-teal-200/60 px-2.5 py-1 rounded-lg">
                    <Activity size={12} /> {docName} ({docSpecialty})
                  </div>
                )}
                {patient.phone && (
                  <span className="text-slate-500 font-medium px-2 py-1 bg-slate-50 rounded-lg">
                    📞 {patient.phone}
                  </span>
                )}
              </div>

            </div>
          </div>

          <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
            <div className="text-left sm:text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Protocol Progress</div>
              <div className="text-lg font-display font-bold text-slate-900 mt-0.5">{sessions.length} / {plannedSessions} Sessions</div>
            </div>
            <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden mt-1.5">
              <div className="bg-teal-600 h-full rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex gap-1.5 bg-slate-200/60 p-1.5 rounded-2xl w-fit no-print">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tab === t
                ? "bg-white text-slate-900 shadow-sm shadow-slate-900/5"
                : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="no-print">
        {tab === "Overview"            && <OverviewTab patient={patient} sessions={sessions} assessment={assessment} plan={plan} therapists={therapists} onSelectTab={setTab} onOpenReport={() => setReportModalOpen(true)} />}
        {tab === "Clinical Assessment"  && <AssessmentTab patient={patient} assessment={assessment} />}
        {tab === "Treatment Plan"      && <TreatmentPlanTab patient={patient} plan={plan} />}
        {tab === "Session History"     && <SessionsTab patient={patient} sessions={sessions} />}
      </div>

      {/* ── Patient Growth & Clinical Outcome Certificate Modal ──── */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-fade-in">
            {/* Modal header bar */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50 no-print">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">Official Clinical Progress Report</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 shadow-sm transition-all"
                >
                  <Printer size={13} /> Print / Export PDF
                </button>
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Printable Report Document Body */}
            <div className="p-6 sm:p-10 overflow-y-auto space-y-6 text-slate-800" id="printable-clinical-report">
              {/* Report Clinic Letterhead */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
                <div>
                  <div className="font-display font-black text-xl tracking-wider text-slate-900 uppercase">FEEL EASE PHYSIOTHERAPY</div>
                  <div className="text-xs text-teal-700 font-bold tracking-widest uppercase mt-0.5">SUNRISE REHABILITATION CENTER</div>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                    402-405, Healthcare Hub, Vastrapur Ring Road, Surat · +91 261 400 1122 · info@feeleserehab.com
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs font-bold text-teal-700">REF: RP-{patient.code || patient.id.slice(0, 8).toUpperCase()}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Issued: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 mt-1">
                    Verified Medical Record
                  </span>
                </div>
              </div>

              {/* Patient Demographics Info Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Patient Name</span>
                    <span className="font-bold text-slate-900 text-sm">{patient.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Age / Gender</span>
                    <span className="font-bold text-slate-900">{patient.age || "—"} yrs · {patient.gender || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Attending Physio</span>
                    <span className="font-bold text-slate-900">{docName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Primary Diagnosis</span>
                    <span className="font-bold text-slate-900">{assessment?.diagnosis || patient.diagnosis || "Musculoskeletal Condition"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Adherence / Sessions</span>
                    <span className="font-bold text-slate-900">{sessions.length} of {plannedSessions} ({progressPct}% Protocol Done)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block text-[10px] uppercase">Clinical Status</span>
                    <span className="font-bold text-teal-700">{patient.status || "Ongoing"}</span>
                  </div>
                </div>
              </div>

              {/* Metric Highlight Cards — REAL Verified Data */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                  <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Baseline Pain</div>
                  <div className="text-2xl font-display font-bold text-rose-600 mt-1">
                    {initialPain != null ? `${initialPain}/10 VAS` : "Pending"}
                  </div>
                  <div className="text-[10px] text-rose-600 mt-0.5">
                    {initialPain != null ? "Initial Assessment" : "Awaiting 1st Session"}
                  </div>
                </div>
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl">
                  <div className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">Current Pain</div>
                  <div className="text-2xl font-display font-bold text-teal-600 mt-1">
                    {currentPain != null ? `${currentPain}/10 VAS` : "Pending"}
                  </div>
                  <div className="text-[10px] text-teal-600 mt-0.5">
                    {currentPain != null ? "Last Follow-up" : "Awaiting 1st Session"}
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Relief Achieved</div>
                  <div className="text-2xl font-display font-bold text-emerald-600 mt-1">
                    {initialPain != null && currentPain != null ? `↓ ${reliefPoints} pts (${pctRelief}%)` : "In Progress"}
                  </div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">
                    {initialPain != null && currentPain != null ? "Functional Recovery" : "Based on Logged Sessions"}
                  </div>
                </div>
              </div>

              {/* Functional Trajectory Narrative */}
              <div className="space-y-3 text-xs leading-relaxed border border-slate-200 p-4 rounded-2xl">
                <h4 className="font-display font-bold text-slate-900 text-sm">Clinical Functional Trajectory & Observations</h4>
                {hasSessions && initialPain != null && currentPain != null ? (
                  <p>
                    Patient <b>{patient.name}</b> has completed <b>{sessions.length}</b> supervised physical therapy session{sessions.length === 1 ? "" : "s"} for <b>{assessment?.diagnosis || patient.diagnosis || "rehabilitation"}</b>. 
                    Visual Analog Scale (VAS) pain evaluation demonstrates a modulation from an initial score of <b>{initialPain}/10</b> to <b>{currentPain}/10</b>, 
                    reflecting verified symptomatic improvement of <b>{pctRelief}%</b>.
                  </p>
                ) : (
                  <p>
                    Patient <b>{patient.name}</b> has established clinical intake for <b>{assessment?.diagnosis || patient.diagnosis || "rehabilitation"}</b>. 
                    {sessions.length > 0
                      ? `${sessions.length} therapy session(s) have been administered. Pain modulation scores will continue to update as clinical evaluations are logged.`
                      : "Initial therapy sessions have not yet been logged. Baseline pain modulation and functional trajectory metrics will be automatically calculated as treatment sessions are recorded."}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                  <div>
                    <span className="font-bold text-slate-700">Chief Complaint:</span> {assessment?.chief_complaint || "Rehabilitation management"}
                  </div>
                  <div>
                    <span className="font-bold text-slate-700">Rehab Goals:</span> {assessment?.goals || "Restoration of full mobility & function"}
                  </div>
                </div>
              </div>

              {/* Session progression history table */}
              {sessions.length > 0 && (
                <div>
                  <h4 className="font-display font-bold text-slate-900 text-xs mb-2">Verified Session Progression (Recent)</h4>
                  <table className="w-full text-left text-[11px] border-collapse border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3 text-center">Pain Before</th>
                        <th className="py-2 px-3 text-center">Pain After</th>
                        <th className="py-2 px-3">Therapist Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sessions.slice(0, 5).map((s) => (
                        <tr key={s.id}>
                          <td className="py-2 px-3 font-mono font-medium">{s.date}</td>
                          <td className="py-2 px-3 font-semibold">{s.type || "Therapy"}</td>
                          <td className="py-2 px-3 text-center text-rose-600 font-bold">{s.pain_before ?? "—"}</td>
                          <td className="py-2 px-3 text-center text-teal-600 font-bold">{s.pain_after ?? "—"}</td>
                          <td className="py-2 px-3 text-slate-500 truncate max-w-xs">{s.notes || "Treatment administered as scheduled."}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Doctor signature block */}
              <div className="flex items-end justify-between pt-8 border-t border-slate-200 text-xs">
                <div>
                  <span className="font-bold text-slate-700">Status:</span> {patient.status || "Ongoing Care"}
                  <div className="text-[10px] text-slate-400 mt-0.5">Feel Ease Physiotherapy · Clinic Management System</div>
                </div>
                <div className="text-right">
                  <div className="w-48 border-b-2 border-slate-900 mb-1 ml-auto" />
                  <div className="font-bold text-slate-900">{docName}</div>
                  <div className="text-[10px] text-slate-400">{docSpecialty} · Authorized Signatory</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Tab: Overview ─────────────────────────────────────── */
function OverviewTab({ patient, sessions, assessment, plan, therapists = [], onSelectTab, onOpenReport }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Contact & Registration</h3>
        <div className="space-y-2.5 text-xs">
          <Row label="Phone" value={patient.phone} />
          <Row label="Email" value={patient.email} />
          <Row label="Address" value={patient.address} />
          <Row label="Emergency Contact" value={patient.emergency_contact} />
          <Row label="Referred By" value={patient.referred_by} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clinical Profile</h3>
          <button
            onClick={() => onSelectTab?.("Clinical Assessment")}
            className="text-[11px] text-teal-600 font-bold hover:underline cursor-pointer"
          >
            Edit Assessment →
          </button>
        </div>
        <div className="space-y-2.5 text-xs">
          <Row label="Primary Diagnosis" value={assessment?.diagnosis || patient.diagnosis} />
          <Row
            label="Attending Doctor"
            value={
              (patient.therapists as any)?.name
                ? `${(patient.therapists as any).name} (${(patient.therapists as any).specialty || "Physiotherapist"})`
                : "Unassigned"
            }
          />
          <Row label="Medical History" value={assessment?.history || "No medical history recorded"} />
          <Row label="Contraindications" value={assessment?.contraindications || "None reported"} />
          <Row label="Chief Complaint" value={assessment?.chief_complaint || "Rehabilitation management"} />
          <Row label="Rehabilitation Goals" value={assessment?.goals || "Restoration of full mobility & function"} />
        </div>
      </div>

      <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Official Clinical Outcome Certificate</h3>
          <p className="text-xs text-slate-500 mt-0.5">Generate, print, or export an authorized PDF progress certificate for the patient or insurance claims.</p>
        </div>
        <button
          type="button"
          onClick={onOpenReport}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <Printer size={15} /> Open Clinical Report
        </button>
      </div>
    </div>
  );
}

/* ── Tab: Assessment ───────────────────────────────────── */
function AssessmentTab({ patient, assessment }: { patient: any; assessment: any }) {
  const [form, setForm] = useState({
    chief_complaint:   assessment?.chief_complaint   ?? "",
    history:           assessment?.history           ?? "",
    diagnosis:         assessment?.diagnosis         ?? "",
    contraindications: assessment?.contraindications ?? "",
    goals:             assessment?.goals             ?? "",
  });
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  const save = () => {
    start(async () => {
      await upsertAssessment({ patient_id: patient.id, ...form });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-4">
      <div>
        <h3 className="font-display font-bold text-slate-900 text-base">Physiotherapy Clinical Assessment</h3>
        <p className="text-xs text-slate-500">Document functional diagnosis, symptoms, and rehabilitation goals.</p>
      </div>

      {(["chief_complaint", "history", "diagnosis", "contraindications", "goals"] as const).map((field) => (
        <div key={field}>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
            {field.replace("_", " ")}
          </label>
          <textarea
            value={form[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            rows={2}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none"
            placeholder={`Enter ${field.replace("_", " ")}…`}
          />
        </div>
      ))}

      <button
        onClick={save}
        disabled={pending}
        className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 shadow-sm transition-all disabled:opacity-60"
      >
        {saved ? "✓ Saved Changes" : pending ? "Saving…" : "Save Assessment"}
      </button>
    </div>
  );
}

/* ── Tab: Treatment Plan ───────────────────────────────── */
function TreatmentPlanTab({ patient, plan }: { patient: any; plan: any }) {
  const [startDate, setStartDate] = useState(plan?.start_date ?? "");
  const [endDate, setEndDate]     = useState(plan?.end_date   ?? "");
  const [items, setItems]         = useState<string[]>(Array.isArray(plan?.items) ? plan.items : [""]);
  const [pending, start]          = useTransition();
  const [saved, setSaved]         = useState(false);

  const save = () => {
    start(async () => {
      await upsertPlan({
        patient_id: patient.id,
        start_date: startDate || null,
        end_date:   endDate   || null,
        items:      items.filter(Boolean),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_1px_3px_rgba(15,23,42,0.04)] space-y-4">
      <div>
        <h3 className="font-display font-bold text-slate-900 text-base">Rehabilitation Treatment Protocol</h3>
        <p className="text-xs text-slate-500">Define treatment schedule, intervention frequencies, and target duration.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Protocol Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Target Completion Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Prescribed Exercises & Interventions</label>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={item}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = e.target.value;
                  setItems(next);
                }}
                placeholder={`e.g. Lumbar mobilization + Core activation (3x weekly)`}
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setItems(items.filter((_, j) => j !== i))}
                className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setItems([...items, ""])}
            className="text-xs text-teal-600 font-bold hover:underline inline-flex items-center gap-1 mt-1"
          >
            <Plus size={13} /> Add Intervention Item
          </button>
        </div>
      </div>

      <button
        onClick={save}
        disabled={pending}
        className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 shadow-sm transition-all disabled:opacity-60"
      >
        {saved ? "✓ Plan Saved" : pending ? "Saving…" : "Save Treatment Protocol"}
      </button>
    </div>
  );
}

/* ── Tab: Sessions ─────────────────────────────────────── */
function SessionsTab({ patient, sessions }: { patient: any; sessions: any[] }) {
  const [showForm, setShowForm] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    date: today,
    type: "Manual Therapy & Exercise",
    pain_before: "6",
    pain_after: "3",
    notes: "",
  });
  const [sessionError, setSessionError] = useState("");
  const [pending, start] = useTransition();

  const save = () => {
    setSessionError("");
    if (form.date > today) {
      setSessionError("Session history cannot be recorded for a future date. Post-treatment pain and clinical outcomes must be logged upon concluding the session.");
      return;
    }
    if (form.pain_before === "" || form.pain_after === "") {
      setSessionError("Both pain before and pain after scores are required to evaluate post-treatment recovery.");
      return;
    }

    start(async () => {
      try {
        await addSession({
          patient_id:   patient.id,
          therapist_id: (patient.therapists as any)?.id ?? patient.therapist_id,
          date:         form.date,
          type:         form.type || null,
          pain_before:  Number(form.pain_before),
          pain_after:   Number(form.pain_after),
          notes:        form.notes || null,
        });
        setShowForm(false);
      } catch (err: any) {
        setSessionError(err.message || "Failed to record session outcome.");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-bold text-slate-900 text-base">Rehabilitation Session Log ({sessions.length})</h3>
          <p className="text-xs text-slate-500">Record verified pain modulation scores and treatments administered upon session completion.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/appointments"
            className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Calendar size={13} /> Complete Scheduled Visit →
          </Link>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setSessionError("");
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus size={14} /> Record Completed Session
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-teal-200 p-5 shadow-lg space-y-4 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Session Completion &amp; Outcome Entry</h4>
              <p className="text-[11px] text-slate-500">Logged immediately after performing therapy to accurately document post-session pain relief.</p>
            </div>
            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              Visit Completion Only
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Session Date (Today or earlier)
              </label>
              <input
                type="date"
                max={today}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Treatment Modality Administered</label>
              <input
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                placeholder="e.g. Lumbar mobilization + Heat pack"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pre-Session Pain Level (0–10 VAS)</label>
              <input
                type="number"
                min={0}
                max={10}
                value={form.pain_before}
                onChange={(e) => setForm({ ...form, pain_before: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Post-Session Pain Level (0–10 VAS)</label>
              <input
                type="number"
                min={0}
                max={10}
                value={form.pain_after}
                onChange={(e) => setForm({ ...form, pain_after: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Doctor Feedback &amp; Clinical Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="Record patient response, mobility improvements, home exercise instructions…"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
            />
          </div>

          {sessionError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {sessionError}
            </div>
          )}

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              {pending ? "Saving Outcome…" : "✓ Confirm Completed Session"}
            </button>
          </div>
        </div>
      )}


      {/* Session list cards */}
      <div className="space-y-2.5">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-slate-300 transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col items-center justify-center shrink-0">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">
                  {new Date(s.date).toLocaleDateString("en-IN", { month: "short" })}
                </span>
                <span className="text-base font-display font-bold text-slate-900 leading-tight">
                  {new Date(s.date).getDate()}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-xs">{s.type || "Physical Therapy"}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-md line-clamp-1">{s.notes || "Standard rehab session."}</p>
              </div>
            </div>

            {(s.pain_before !== null || s.pain_after !== null) && (
              <div className="flex items-center gap-4 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 shrink-0 self-start sm:self-center">
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Before</div>
                  <div className="text-sm font-bold text-rose-600">{s.pain_before ?? "—"}/10</div>
                </div>
                <div className="text-slate-300">→</div>
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">After</div>
                  <div className="text-sm font-bold text-teal-600">{s.pain_after ?? "—"}/10</div>
                </div>
              </div>
            )}
          </div>
        ))}

        {sessions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80">
            <HeartPulse size={30} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-600">No sessions recorded yet.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Click &quot;Log New Session&quot; above to record the initial therapy visit.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── UI Helpers ────────────────────────────────────────── */
function StatusChip({ status }: { status: string }) {
  const map: Record<string, { bg: string; dot: string }> = {
    Ongoing:    { bg: "bg-teal-50 text-teal-700 border-teal-200/60", dot: "bg-teal-500" },
    Completed:  { bg: "bg-emerald-50 text-emerald-700 border-emerald-200/60", dot: "bg-emerald-500" },
    Discharged: { bg: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
    New:        { bg: "bg-indigo-50 text-indigo-700 border-indigo-200/60", dot: "bg-indigo-500" },
  };
  const s = map[status] || map.Ongoing;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${s.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
      <span className="text-slate-400 font-medium">{label}</span>
      <span className="font-semibold text-slate-800">{value || "—"}</span>
    </div>
  );
}
