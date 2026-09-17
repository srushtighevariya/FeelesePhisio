"use client";

import { format } from "date-fns";
import Link from "next/link";
import {
  Users,
  Calendar,
  ClipboardList,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
  Stethoscope,
  Plus,
  Shield,
  Activity,
} from "lucide-react";
import { cn, getInitials, formatTime, formatDate } from "@/lib/utils";

// ── Types for props ──────────────────────────────────────────
export interface DashboardStats {
  totalPatients: number;
  totalSessions: number;
  totalAppointments: number;
  sessionsToday: number;
  patientsToday: number;
  hoursToday: number;
}

export interface ApptStatusCounts {
  scheduled: number;
  completed: number;
  cancelled: number;
  missed: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JoinedAppointment = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JoinedPlan = any;

interface DashboardClientProps {
  stats: DashboardStats;
  todayAppointments: JoinedAppointment[];
  upcomingAppointments: JoinedAppointment[];
  recentPatients: JoinedAppointment[];
  activePlans: JoinedPlan[];
  apptStatusCounts: ApptStatusCounts;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inactivePatients: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allTherapists?: any[];
  role: "admin" | "therapist";
  userName: string;
  today: string;
}

// ── Status badge helper ──────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const norm = (status || "").toLowerCase();
  const cls: Record<string, string> = {
    completed: "badge-completed",
    scheduled: "badge-scheduled",
    cancelled: "badge-cancelled",
    missed:    "badge-missed",
    active:    "badge-active",
  };
  const dot: Record<string, string> = {
    completed: "bg-green-500",
    scheduled: "bg-yellow-400",
    cancelled: "bg-red-500",
    missed:    "bg-gray-400",
    active:    "bg-blue-500",
  };
  return (
    <span className={cls[norm] ?? "badge-missed"}>
      <span className={cn("w-1.5 h-1.5 rounded-full", dot[norm] ?? "bg-gray-400")} />
      {norm.charAt(0).toUpperCase() + norm.slice(1)}
    </span>
  );
}

// ── Circular progress ────────────────────────────────────────
function CircleStat({
  value,
  label,
  sub,
}: {
  value: number | string;
  label: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-20 h-20 rounded-full border-[5px] border-accent/20 flex items-center justify-center bg-dark transition-transform hover:scale-105">
        <div className="text-center">
          <p className="text-white text-xl font-bold leading-tight">{value}</p>
          {sub && <p className="text-white/40 text-[9px] leading-none mt-0.5">{sub}</p>}
        </div>
      </div>
      <p className="text-white/60 text-xs font-medium text-center">{label}</p>
    </div>
  );
}

// ── Segmented progress bar ───────────────────────────────────
function SegmentedProgress({ pct }: { pct: number }) {
  const segments = 10;
  const filled = Math.round((pct / 100) * segments);
  return (
    <div className="flex gap-1">
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex-1 h-1.5 rounded-pill transition-colors",
            i < filled ? "bg-accent" : "bg-[#D4CFC6]"
          )}
        />
      ))}
    </div>
  );
}

export function DashboardClient({
  stats,
  todayAppointments,
  upcomingAppointments,
  recentPatients,
  activePlans,
  apptStatusCounts,
  inactivePatients,
  allTherapists = [],
  role,
  userName,
  today,
}: DashboardClientProps) {
  const formattedDate = format(new Date(today), "EEEE, d MMMM yyyy");
  const isAdmin = role === "admin";

  return (
    <div className="space-y-6 animate-fade-in pb-20 lg:pb-0">
      {/* ── Page Header ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-pill uppercase tracking-wider ${
                isAdmin ? "bg-accent/20 text-accent" : "bg-[#DDD5C7] text-[#4B4B4B]"
              }`}
            >
              {isAdmin ? "Clinic Admin Hub" : "Therapist Clinical Portal"}
            </span>
            <span className="text-xs text-[#9B9B9B]">•</span>
            <span className="text-xs text-[#9B9B9B]">Dr. {userName}</span>
          </div>
          <h1 className="heading-lg">Clinic Dashboard</h1>
          <p className="body-sm mt-0.5">{formattedDate}</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link href="/dashboard/therapists/new" className="btn-secondary no-print text-xs">
              <Plus size={14} /> Add Therapist
            </Link>
          )}
          <Link href="/dashboard/appointments" className="btn-primary no-print">
            <Calendar size={15} />
            New Appointment
          </Link>
        </div>
      </div>

      {/* ── Top row: Clinic Snapshot (dark panel) + Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Clinic Snapshot — signature dark circular stats card */}
        <div className="card-dark p-6 col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-white/40 text-xs uppercase tracking-widest font-semibold">
                Today&apos;s Snapshot
              </p>
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            </div>
            <div className="flex justify-around py-2">
              <CircleStat value={stats.sessionsToday} label="Sessions" sub="today" />
              <CircleStat value={stats.patientsToday} label="Patients" sub="seen" />
              <CircleStat
                value={stats.hoursToday}
                label="Hours"
                sub="booked"
              />
            </div>
          </div>

          {/* Status breakdown */}
          <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 gap-3">
            {[
              { label: "Scheduled", count: apptStatusCounts.scheduled, color: "text-yellow-400" },
              { label: "Completed", count: apptStatusCounts.completed, color: "text-green-400" },
              { label: "Cancelled", count: apptStatusCounts.cancelled, color: "text-red-400" },
              { label: "Missed",    count: apptStatusCounts.missed,    color: "text-gray-400" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className={cn("text-lg font-bold", s.color)}>{s.count}</span>
                <span className="text-white/40 text-xs font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals cards */}
        <div className="col-span-1 lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Total Patients",
              value: stats.totalPatients,
              icon: Users,
              href: "/dashboard/patients",
              color: "bg-blue-50 text-blue-600",
            },
            {
              label: "Total Sessions",
              value: stats.totalSessions,
              icon: ClipboardList,
              href: "/dashboard/reports",
              color: "bg-amber-50 text-amber-600",
            },
            {
              label: "Appointments",
              value: stats.totalAppointments,
              icon: Calendar,
              href: "/dashboard/appointments",
              color: "bg-green-50 text-green-600",
            },
          ].map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="card-white p-5 hover:shadow-panel transition-all group cursor-pointer"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                  card.color
                )}
              >
                <card.icon size={19} strokeWidth={1.8} />
              </div>
              <p className="text-2xl font-bold text-[#1A1A1A]">{card.value}</p>
              <p className="body-sm mt-0.5">{card.label}</p>
              <ArrowRight
                size={14}
                className="text-[#9B9B9B] mt-3 group-hover:text-accent transition-colors"
              />
            </Link>
          ))}

          {/* Today's appointments mini-list */}
          <div className="card-white p-5 col-span-2 sm:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <p className="heading-sm">Today&apos;s Appointments</p>
              <Link href="/dashboard/appointments" className="text-xs font-semibold text-accent hover:underline">
                View all ({todayAppointments.length})
              </Link>
            </div>
            {todayAppointments.length === 0 ? (
              <p className="body-sm text-center py-6 text-[#9B9B9B]">No appointments scheduled for today.</p>
            ) : (
              <div className="space-y-2">
                {todayAppointments.slice(0, 4).map((appt) => (
                  <div
                    key={appt.id || appt.appointment_id}
                    className="flex items-center justify-between py-2.5 border-b border-[#E8E4DB] last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#DDD5C7] flex items-center justify-center text-xs font-semibold text-[#4B4B4B] flex-shrink-0">
                        {getInitials(appt.patients?.name ?? "?")}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A]">
                          {appt.patients?.name ?? "Unknown Patient"}
                        </p>
                        <p className="text-xs text-[#9B9B9B]">
                          {formatTime(appt.time)} • {appt.type || appt.treatment_type || "Physiotherapy"}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={appt.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Middle row: Active Rehab Cases + Upcoming Appointments ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Active rehabilitation cases */}
        <div className="card-white p-6">
          <div className="section-header">
            <div>
              <p className="heading-sm">Active Rehabilitation Cases</p>
              <p className="text-xs text-[#9B9B9B] mt-0.5">Patients currently in treatment</p>
            </div>
            <Link href="/dashboard/patients" className="text-xs font-semibold text-accent hover:underline">
              View all
            </Link>
          </div>

          {activePlans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity size={28} className="text-[#D4CFC6] mb-2" />
              <p className="body-sm">No active rehabilitation cases</p>
              <Link href="/dashboard/patients/new" className="btn-primary mt-4 text-xs">
                Add Patient
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activePlans.map((patient: any) => (
                <Link
                  key={patient.id}
                  href={`/dashboard/patients/${patient.id}`}
                  className="flex items-center gap-3 py-2.5 border-b border-[#E8E4DB] last:border-0 hover:bg-[#F7F5F0] -mx-2 px-2 rounded-xl transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-[#DDD5C7] flex items-center justify-center text-xs font-semibold text-[#4B4B4B] flex-shrink-0">
                    {(patient.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A1A1A] truncate">{patient.name}</p>
                    <p className="text-xs text-[#9B9B9B] truncate">{patient.diagnosis || "General Physiotherapy"}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-pill border flex-shrink-0 ${
                    patient.status === "Ongoing" ? "bg-blue-50 text-blue-700 border-blue-200" :
                    patient.status === "New" ? "bg-purple-50 text-purple-700 border-purple-200" :
                    "bg-green-50 text-green-700 border-green-200"
                  }`}>
                    {patient.status || "Active"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming appointments */}
        <div className="card-white p-6">
          <div className="section-header">
            <p className="heading-sm">Upcoming Appointments</p>
            <Link href="/dashboard/appointments" className="text-xs font-semibold text-accent hover:underline">
              View all
            </Link>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar size={28} className="text-[#D4CFC6] mb-2" />
              <p className="body-sm">No upcoming appointments</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingAppointments.map((appt) => (
                <div
                  key={appt.id || appt.appointment_id}
                  className="flex items-center gap-3 py-2.5 border-b border-[#E8E4DB] last:border-0"
                >
                  {/* Date chip */}
                  <div className="w-11 h-11 rounded-xl bg-[#DDD5C7] flex flex-col items-center justify-center flex-shrink-0">
                    <p className="text-[10px] font-semibold text-[#9B9B9B] uppercase leading-none">
                      {appt.date ? format(new Date(appt.date), "MMM") : "—"}
                    </p>
                    <p className="text-base font-bold text-[#1A1A1A] leading-tight">
                      {appt.date ? format(new Date(appt.date), "d") : "—"}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A1A1A] truncate">
                      {appt.patients?.name ?? "Unknown Patient"}
                    </p>
                    <p className="text-xs text-[#9B9B9B]">
                      {formatTime(appt.time)} • {appt.type || appt.treatment_type || "Physiotherapy"}
                    </p>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Admin View: Clinic Staff Doctor Roster ── */}
      {isAdmin && allTherapists.length > 0 && (
        <div className="card-white p-6">
          <div className="section-header">
            <div>
              <p className="heading-sm">Physiotherapy Staff & Doctors</p>
              <p className="text-xs text-[#9B9B9B] mt-0.5">Manage doctor credentials and allocations</p>
            </div>
            <Link href="/dashboard/therapists" className="text-xs font-semibold text-accent hover:underline">
              Manage Staff ({allTherapists.length})
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {allTherapists.slice(0, 4).map((t: any) => (
              <div key={t.id} className="p-4 rounded-2xl bg-[#EDE9E1]/50 border border-[#D4CFC6] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-dark flex items-center justify-center text-white font-bold text-xs">
                      {getInitials(t.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#1A1A1A] truncate">{t.name}</p>
                      <p className="text-xs text-[#9B9B9B] truncate">{t.specialty || "Physical Therapist"}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1 px-2.5 bg-white rounded-pill border border-[#D4CFC6]/60 mb-2">
                    <span className="text-[#9B9B9B]">Active Cases:</span>
                    <span className="font-bold text-[#1A1A1A]">{t.patients?.[0]?.count ?? t.patient_count ?? 0}</span>
                  </div>
                </div>
                <Link
                  href="/dashboard/therapists"
                  className="mt-2 text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                >
                  <Shield size={12} /> Set Credentials →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom row: Recent Patients ─────────────────────── */}
      <div className="card-white p-6">
        <div className="section-header">
          <p className="heading-sm">Recently Registered Patients</p>
          <Link href="/dashboard/patients" className="text-xs font-semibold text-accent hover:underline">
            View all patients
          </Link>
        </div>

        {recentPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users size={28} className="text-[#D4CFC6] mb-2" />
            <p className="body-sm">No patients registered yet</p>
            <Link href="/dashboard/patients/new" className="btn-primary mt-4 text-xs">
              Add First Patient
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Diagnosis / Case</th>
                  <th>Registered</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentPatients.map((p) => (
                  <tr key={p.id || p.patient_id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#DDD5C7] flex items-center justify-center text-xs font-semibold text-[#4B4B4B] flex-shrink-0">
                          {getInitials(p.name ?? "")}
                        </div>
                        <span className="font-medium text-[#1A1A1A]">{p.name}</span>
                      </div>
                    </td>
                    <td>{p.age || "—"}</td>
                    <td className="capitalize">{p.gender || "—"}</td>
                    <td className="text-xs text-[#4B4B4B] truncate max-w-[200px]">{p.diagnosis || "General Physiotherapy"}</td>
                    <td>
                      {p.created_at || p.registration_date
                        ? formatDate(p.created_at || p.registration_date)
                        : "—"}
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/dashboard/patients/${p.id || p.patient_id}`}
                        className="text-xs font-semibold text-accent hover:underline"
                      >
                        View Profile →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Inactive Patient Alerts (WhatsApp outreach) ──────────── */}
      {inactivePatients.length > 0 && (
        <div className="card-white p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={15} className="text-orange-500" />
            </div>
            <div>
              <p className="label font-bold text-orange-600">Inactive Follow-up Alerts</p>
              <p className="text-xs text-[#9B9B9B]">Patients registered 30+ days ago who may need continuing therapy</p>
            </div>
            <span className="ml-auto text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-pill border border-orange-200">
              {inactivePatients.length} patients
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Contact</th>
                  <th>Registered</th>
                  <th className="text-right">Quick Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {inactivePatients.map((p) => (
                  <tr key={p.id || p.patient_id}>
                    <td className="font-medium text-[#1A1A1A]">{p.name}</td>
                    <td className="text-sm text-[#4B4B4B]">{p.phone ?? "—"}</td>
                    <td className="text-sm text-[#4B4B4B]">
                      {formatDate(p.created_at || p.registration_date)}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-3">
                        {p.phone && (
                          <a
                            href={`https://wa.me/91${p.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${p.name}, we miss you at FeelEase Physio! Would you like to schedule your next physiotherapy session? 😊`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#25D366] hover:underline font-semibold"
                          >
                            WhatsApp
                          </a>
                        )}
                        <Link
                          href={`/dashboard/patients/${p.id || p.patient_id}`}
                          className="text-xs font-semibold text-accent hover:underline"
                        >
                          View →
                        </Link>
                      </div>
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
export default DashboardClient;
