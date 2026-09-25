"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Users, ArrowRight, X } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface Therapist {
  id: string;
  name: string;
}

interface Patient {
  id: string;
  code?: string;
  name: string;
  age?: number | null;
  gender?: string | null;
  diagnosis?: string | null;
  status?: string | null;
  therapist_id?: string | null;
  therapists?: { id: string; name: string } | null;
}

interface Props {
  patients: Patient[];
  therapists: Therapist[];
  isAdmin: boolean;
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  const s = (status || "").toLowerCase();
  if (s === "completed") return <span className="badge-completed">Completed</span>;
  if (s === "cancelled") return <span className="badge-cancelled">Cancelled</span>;
  if (s === "discharged") return <span className="badge-missed">Discharged</span>;
  return <span className="badge-active">{status || "Active"}</span>;
}

export function PatientsClient({ patients, therapists, isAdmin }: Props) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [doctor, setDoctor] = useState("");

  // All filtering is instant — pure in-memory, zero network calls
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return patients.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) &&
          !(p.code || "").toLowerCase().includes(q) &&
          !(p.diagnosis || "").toLowerCase().includes(q)) return false;
      if (status && (p.status || "").toLowerCase() !== status.toLowerCase()) return false;
      if (doctor && p.therapist_id !== doctor) return false;
      return true;
    });
  }, [patients, search, status, doctor]);

  const hasFilters = search || status || doctor;

  function clearFilters() {
    setSearch("");
    setStatus("");
    setDoctor("");
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="card-white p-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient name, case id, diagnosis…"
            className="input-base pl-9 text-xs w-full"
          />
        </div>

        {/* Status — instant filter */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-[#D4CFC6] bg-white text-xs text-[#1A1A1A] font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent cursor-pointer"
        >
          <option value="">All Statuses</option>
          {["Ongoing", "Completed", "Discharged"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Doctor — instant filter (admin only) */}
        {isAdmin && therapists.length > 0 && (
          <select
            value={doctor}
            onChange={(e) => setDoctor(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-[#D4CFC6] bg-white text-xs text-[#1A1A1A] font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent cursor-pointer"
          >
            <option value="">All Attending Doctors</option>
            {therapists.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}

        {/* Result count */}
        <span className="text-xs text-[#9B9B9B] font-medium">
          {filtered.length} of {patients.length}
        </span>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="btn-ghost text-xs inline-flex items-center gap-1"
          >
            <X size={13} /> Reset
          </button>
        )}
      </div>

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
              {filtered.map((p) => (
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
                    <StatusBadge status={p.status} />
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
              ))}

              {!filtered.length && (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-[#9B9B9B]">
                    <Users size={32} className="mx-auto text-[#D4CFC6] mb-2" />
                    <p className="font-semibold text-[#1A1A1A] text-sm">
                      {hasFilters ? "No patients match these filters." : "No patient records found."}
                    </p>
                    {hasFilters ? (
                      <button onClick={clearFilters} className="text-accent hover:underline text-xs font-semibold mt-2">
                        Clear filters →
                      </button>
                    ) : (
                      <Link href="/dashboard/patients/new" className="inline-flex items-center gap-1 text-accent hover:underline text-xs font-semibold mt-2">
                        Register a new patient →
                      </Link>
                    )}
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

export default PatientsClient;
