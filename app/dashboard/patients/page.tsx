import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Users, ArrowRight } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { getCachedAuthUser } from "@/lib/auth-cache";
import { Suspense } from "react";
import { PatientsFilterBar } from "@/components/patients/PatientsFilterBar";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; doctor?: string }>;
}) {
  const { q = "", status = "", doctor = "" } = await searchParams;
  const auth = await getCachedAuthUser();
  const isAdmin = auth?.isAdmin ?? false;
  const therapistId = auth?.therapistId;

  const supabase = await createClient();

  let query = supabase
    .from("patients")
    .select("id,code,name,age,gender,diagnosis,status,therapists(id,name)")
    .order("created_at", { ascending: false });

  if (q) query = query.ilike("name", `%${q}%`);
  if (status) query = query.eq("status", status);
  if (doctor) query = query.eq("therapist_id", doctor);

  // If therapist and no doctor filter specified, auto-filter to own patients
  if (!isAdmin && therapistId) {
    query = query.eq("therapist_id", therapistId);
  }

  const { data: patients } = await query;
  const { data: therapists } = await supabase.from("therapists").select("id,name").order("name");

  function renderStatusBadge(s: string) {
    const norm = (s || "").toLowerCase();
    if (norm === "completed") {
      return <span className="badge-completed">Completed</span>;
    }
    if (norm === "cancelled") {
      return <span className="badge-cancelled">Cancelled</span>;
    }
    return <span className="badge-active">{s || "Active"}</span>;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-lg">
            {isAdmin ? "Patient Records" : "My Patient Cases"}
          </h1>
          <p className="body-sm mt-0.5">{patients?.length ?? 0} active recovery patient cases</p>
        </div>
        <Link
          href="/dashboard/patients/new"
          id="add-patient-btn"
          className="btn-primary"
        >
          <Plus size={15} /> Register New Patient
        </Link>
      </div>

      {/* Filter Bar */}
      <Suspense fallback={<div className="card-white p-4 h-14 animate-pulse rounded-2xl" />}>
        <PatientsFilterBar
          q={q}
          status={status}
          doctor={doctor}
          therapists={therapists ?? null}
          isAdmin={isAdmin}
        />
      </Suspense>

      {/* Patient Table */}
      <div className="card-white overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Demographics</th>
                <th>Clinical Diagnosis</th>
                <th>Attending Doctor</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {(patients ?? []).map((p: any) => {
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#DDD5C7] flex items-center justify-center text-xs font-semibold text-[#4B4B4B] shrink-0">
                          {getInitials(p.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-[#1A1A1A] text-sm">{p.name}</p>
                          <p className="text-[10px] text-[#9B9B9B] font-mono">{p.code || `PT-${p.id.slice(0, 6)}`}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      {p.age ? `${p.age} yrs` : "—"} · {p.gender || "—"}
                    </td>
                    <td className="max-w-xs truncate font-medium text-[#1A1A1A]">
                      {p.diagnosis || "Physiotherapy Treatment"}
                    </td>
                    <td>
                      {(p.therapists as any)?.name ?? "Unassigned"}
                    </td>
                    <td>
                      {renderStatusBadge(p.status)}
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/dashboard/patients/${p.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                      >
                        Open Record <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {!patients?.length && (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-[#9B9B9B]">
                    <Users size={32} className="mx-auto text-[#D4CFC6] mb-2" />
                    <p className="font-semibold text-[#1A1A1A] text-sm">No patient records found.</p>
                    <Link
                      href="/dashboard/patients/new"
                      className="inline-flex items-center gap-1 text-accent hover:underline text-xs font-semibold mt-2"
                    >
                      Register a new patient →
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
