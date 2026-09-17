import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { formatDate, formatTime } from "@/lib/utils";
import { PrintReportButton } from "@/components/reports/PrintReportButton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Patient Clinical Report" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PatientReportPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: patient, error } = await supabase
    .from("patients")
    .select("*, therapists(id, name, specialty)")
    .eq("id", id)
    .single();

  if (error || !patient) notFound();

  const [
    { data: rawAssessments },
    { data: rawPlans },
    { data: rawSessions },
    { data: rawAppointments },
  ] = await Promise.all([
    supabase.from("assessments").select("*").eq("patient_id", id).order("created_at"),
    supabase.from("treatment_plans").select("*").eq("patient_id", id).order("created_at"),
    supabase.from("sessions").select("*").eq("patient_id", id).order("date"),
    supabase.from("appointments").select("date, time, status, type").eq("patient_id", id).order("date", { ascending: false }).limit(5),
  ]);

  const assessments = rawAssessments ?? [];
  const plans = rawPlans ?? [];
  const sessions = rawSessions ?? [];
  const appointments = rawAppointments ?? [];

  const latestAssessment = assessments[assessments.length - 1] ?? null;
  const activePlan = plans.find((p: any) => p.status === "active") ?? plans[plans.length - 1] ?? null;
  const completedSessions = sessions.length;
  const plannedSessions = activePlan?.frequency || 10;
  const completionPct = Math.min(100, Math.round((completedSessions / plannedSessions) * 100));

  const firstPain = sessions.find((s: any) => s.pain_before != null)?.pain_before ?? null;
  const lastPain = [...sessions].reverse().find((s: any) => s.pain_after != null)?.pain_after ?? null;

  const nextAppt = appointments.find((a: any) => (a.status || "").toLowerCase() === "scheduled");
  const generatedDate = format(new Date(), "d MMMM yyyy");

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-20 lg:pb-0">
      {/* Controls — hidden on print */}
      <div className="flex items-center justify-between mb-6 no-print">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/reports" className="btn-ghost">
            <ArrowLeft size={15} />
          </Link>
          <h1 className="heading-lg">Patient Clinical Progress Report</h1>
        </div>
        <PrintReportButton />
      </div>

      <div className="space-y-5">
        {/* Header Card */}
        <div className="card-dark p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/40 text-xs uppercase tracking-widest mb-2 font-semibold">
                Physiotherapy Clinical Progress Report
              </p>
              <h2 className="text-white text-2xl font-bold">{patient.name}</h2>
              <p className="text-white/60 text-sm mt-1">
                {patient.age ? `${patient.age} yrs` : "Age N/A"} • {patient.gender || "Gender N/A"} • Registered {formatDate(patient.created_at)}
              </p>
              <p className="text-accent text-xs font-semibold mt-1">
                Attending: {(patient.therapists as any)?.name ?? "Assigned Physiotherapist"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-xs">Issued Date</p>
              <p className="text-white text-sm font-medium">{generatedDate}</p>
            </div>
          </div>
        </div>

        {/* Patient Details */}
        <div className="card-white p-5">
          <p className="label mb-4">Patient Demographics & Medical Case</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-[#9B9B9B]">Phone</p>
              <p className="text-sm text-[#1A1A1A] font-medium">{patient.phone || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-[#9B9B9B]">Email</p>
              <p className="text-sm text-[#1A1A1A] font-medium">{patient.email || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-[#9B9B9B]">Primary Diagnosis</p>
              <p className="text-sm text-[#1A1A1A] font-medium">{patient.diagnosis || "Musculoskeletal Condition"}</p>
            </div>
            <div>
              <p className="text-xs text-[#9B9B9B]">Status</p>
              <p className="text-sm text-[#1A1A1A] font-medium capitalize">{patient.status || "Active"}</p>
            </div>
          </div>
        </div>

        {/* Latest Assessment */}
        {latestAssessment && (
          <div className="card-white p-5">
            <p className="label mb-4">Initial Assessment Findings</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-[#9B9B9B]">Body Part</p>
                <p className="text-sm text-[#1A1A1A] italic">{latestAssessment.body_part || "Spine / Joints"}</p>
              </div>
              <div>
                <p className="text-xs text-[#9B9B9B]">Initial Pain Level</p>
                <p className="text-sm text-[#1A1A1A] italic font-bold">
                  {latestAssessment.pain_level != null ? `${latestAssessment.pain_level}/10` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#9B9B9B]">Clinical Notes</p>
                <p className="text-sm text-[#1A1A1A] italic truncate">{latestAssessment.notes || "Evaluation recorded"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Sessions Completed", value: completedSessions },
            { label: "Planned Target", value: plannedSessions || "10" },
            { label: "Initial Pain", value: firstPain != null ? `${firstPain}/10` : "Pending" },
            { label: "Current Pain", value: lastPain != null ? `${lastPain}/10` : "Pending" },
          ].map((kpi) => (
            <div key={kpi.label} className="card-white p-4 text-center">
              <p className="text-2xl font-bold text-[#1A1A1A]">{kpi.value}</p>
              <p className="text-xs text-[#9B9B9B] mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Treatment Plan Summary */}
        {activePlan && (
          <div className="card-white p-5">
            <p className="label mb-4">Rehabilitation Protocol</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">
                    {completedSessions}/{plannedSessions} sessions • {completionPct}% protocol completed
                  </p>
                  <p className="text-xs text-[#9B9B9B] mt-0.5">
                    Goal: {activePlan.goals || "Pain reduction & functional mobility restoration"}
                  </p>
                </div>
                <span className="badge-active capitalize">{activePlan.status || "active"}</span>
              </div>
              <div className="bg-[#E8E4DB] rounded-pill h-2.5 overflow-hidden">
                <div
                  className="bg-accent h-full rounded-pill transition-all"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Session History */}
        {sessions.length > 0 && (
          <div className="card-white p-5">
            <p className="label mb-4">Therapy Session Log</p>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Pain Before</th>
                    <th>Pain After</th>
                    <th>Clinical Notes / Exercise</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s: any) => (
                    <tr key={s.id}>
                      <td>{formatDate(s.date)}</td>
                      <td>{s.pain_before != null ? `${s.pain_before}/10` : "—"}</td>
                      <td>{s.pain_after != null ? `${s.pain_after}/10` : "—"}</td>
                      <td className="max-w-[200px] truncate">{s.notes || "Physiotherapy protocol administered"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Next Follow-up */}
        <div className="card-white p-5">
          <p className="label mb-2">Next Scheduled Follow-up</p>
          {nextAppt ? (
            <p className="text-sm text-[#1A1A1A]">
              <span className="font-semibold">{formatDate(nextAppt.date)}</span> at{" "}
              <span className="font-semibold">{formatTime(nextAppt.time)}</span> —{" "}
              {nextAppt.type || "Routine Physiotherapy Session"}
            </p>
          ) : (
            <p className="body-sm">No upcoming appointments scheduled.</p>
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-6 border-t border-[#D4CFC6] text-xs text-[#9B9B9B]">
          <p>This report is generated by FeelEase Physio clinical management system.</p>
          <p className="mt-0.5">Verified Medical Progress Record • For questions contact attending physiotherapist.</p>
        </div>
      </div>
    </div>
  );
}
