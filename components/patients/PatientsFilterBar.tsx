"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { Search } from "lucide-react";
import Link from "next/link";

interface Therapist {
  id: string;
  name: string;
}

interface Props {
  q: string;
  status: string;
  doctor: string;
  therapists: Therapist[] | null;
  isAdmin: boolean;
}

export function PatientsFilterBar({ q, status, doctor, therapists, isAdmin }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const buildUrl = (overrides: Record<string, string>) => {
    const params = new URLSearchParams();
    const current = {
      q: searchInputRef.current?.value ?? q,
      status,
      doctor,
      ...overrides,
    };
    if (current.q) params.set("q", current.q);
    if (current.status) params.set("status", current.status);
    if (current.doctor) params.set("doctor", current.doctor);
    return `/dashboard/patients${params.toString() ? `?${params.toString()}` : ""}`;
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(buildUrl({ status: e.target.value }));
  };

  const handleDoctorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(buildUrl({ doctor: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    const qVal = (formData.get("q") as string) || "";
    if (qVal) params.set("q", qVal);
    if (status) params.set("status", status);
    if (doctor) params.set("doctor", doctor);
    router.push(`/dashboard/patients${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const hasFilters = q || status || doctor;

  return (
    <form
      onSubmit={handleSubmit}
      className="card-white p-4 flex flex-wrap gap-3 items-center"
    >
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B]" />
        <input
          ref={searchInputRef}
          name="q"
          defaultValue={q}
          placeholder="Search patient name, case id…"
          className="input-base pl-9 text-xs"
        />
      </div>

      {/* Status — instant filter */}
      <select
        name="status"
        value={status}
        onChange={handleStatusChange}
        className="px-3.5 py-2.5 rounded-xl border border-[#D4CFC6] bg-white text-xs text-[#1A1A1A] font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent cursor-pointer"
      >
        <option value="">All Statuses</option>
        {["Ongoing", "Completed", "Discharged"].map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Doctor — instant filter (admin only) */}
      {isAdmin && therapists && (
        <select
          name="doctor"
          value={doctor}
          onChange={handleDoctorChange}
          className="px-3.5 py-2.5 rounded-xl border border-[#D4CFC6] bg-white text-xs text-[#1A1A1A] font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent cursor-pointer"
        >
          <option value="">All Attending Doctors</option>
          {therapists.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      )}

      {/* Apply Filter button (also works for search) */}
      <button type="submit" className="btn-secondary text-xs">
        Apply Filter
      </button>

      {hasFilters && (
        <Link href="/dashboard/patients" className="btn-ghost text-xs">
          Reset
        </Link>
      )}
    </form>
  );
}

export default PatientsFilterBar;
