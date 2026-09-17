"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, FileText, Search, UserCheck } from "lucide-react";
import { MonthlyReportClient } from "./MonthlyReportClient";
import { getInitials } from "@/lib/utils";

interface Props {
  patients: any[];
  therapists: any[];
  appts: any[];
  attendance: any[];
  isAdmin?: boolean;
  currentTherapistId?: string | null;
}

export function ReportsHubClient({
  patients,
  therapists,
  appts,
  attendance,
  isAdmin = true,
  currentTherapistId = null,
}: Props) {
  const [activeTab, setActiveTab] = useState<"patients" | "staff">("patients");
  const [search, setSearch] = useState("");

  const filteredPatients = patients.filter((p) =>
    (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.diagnosis || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20 lg:pb-0">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="heading-lg">Clinic Reports & Intelligence</h1>
          <p className="body-sm mt-0.5">
            {isAdmin
              ? "Generate verified clinical reports and doctor performance reviews."
              : "View your verified patient progress reports and clinical performance review."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 bg-[#DDD5C7] p-1.5 rounded-pill w-fit">
          <button
            onClick={() => setActiveTab("patients")}
            className={`px-4 py-2 rounded-pill text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "patients"
                ? "bg-white text-[#1A1A1A] shadow-card"
                : "text-[#4B4B4B] hover:text-[#1A1A1A]"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Activity size={14} className="text-accent" />
              Patient Progress Reports
            </span>
          </button>
          <button
            onClick={() => setActiveTab("staff")}
            className={`px-4 py-2 rounded-pill text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "staff"
                ? "bg-white text-[#1A1A1A] shadow-card"
                : "text-[#4B4B4B] hover:text-[#1A1A1A]"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <UserCheck size={14} className="text-accent" />
              {isAdmin ? "Doctor Performance Reports" : "My Performance Report"}
            </span>
          </button>
        </div>
      </div>


      {/* Patient Progress Reports Tab */}
      {activeTab === "patients" && (
        <div className="space-y-5 animate-fade-in">
          <div className="card-white p-4 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter patients for progress report…"
                className="input-base pl-9 text-xs"
              />
            </div>
            <p className="body-sm text-xs hidden sm:block">
              Showing {filteredPatients.length} of {patients.length} patients
            </p>
          </div>

          {!filteredPatients.length ? (
            <div className="card-white p-12 flex flex-col items-center text-center">
              <Activity size={32} className="text-[#D4CFC6] mb-2" />
              <p className="heading-sm mb-1">No patients found</p>
              <p className="body-sm">Try a different search or register a new patient.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPatients.map((p) => (
                <div key={p.id} className="card-white p-5 flex flex-col justify-between hover:shadow-panel transition-all">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-full bg-dark flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                        {getInitials(p.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#1A1A1A] text-sm truncate">{p.name}</p>
                        <p className="text-xs text-[#9B9B9B] mt-0.5">
                          {p.age ? `${p.age} yrs` : "Age N/A"} • {p.gender || "Patient"}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-[#4B4B4B] line-clamp-2 mb-4 bg-[#EDE9E1]/50 p-2.5 rounded-xl border border-[#D4CFC6]/50">
                      Case: {p.diagnosis || "Physiotherapy Rehabilitation Protocol"}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/reports/${p.id}`}
                    className="btn-primary w-full text-center text-xs !py-2"
                  >
                    <Activity size={14} />
                    Generate Progress Report
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Staff Monthly Reports Tab */}
      {activeTab === "staff" && (
        <div className="animate-fade-in">
          <MonthlyReportClient
            therapists={therapists}
            appts={appts}
            attendance={attendance}
            isAdmin={isAdmin}
          />

        </div>
      )}
    </div>
  );
}
export default ReportsHubClient;
