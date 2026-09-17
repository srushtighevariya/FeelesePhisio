"use client";

import { useState, useTransition } from "react";
import { changePassword } from "@/lib/actions/auth";
import {
  Building2, Clock, Activity, Lock, Check, Save, Shield, Eye, EyeOff
} from "lucide-react";

export default function SettingsPage() {
  const [tab, setTab] = useState<"profile" | "schedule" | "clinical" | "roles" | "security">("profile");

  // Profile Form
  const [profile, setProfile] = useState({
    name: "FeelEase Physiotherapy & Rehab Center",
    tagline: "Specialized Orthopedic, Musculoskeletal & Sports Injury Rehabilitation",
    regNumber: "GUJ-MED-2024-8841",
    director: "Dr. Sara Iqbal, MPT (Ortho)",
    phone: "+91 261 400 1122",
    receptionPhone: "+91 261 400 1123",
    email: "admin@recoverypath.com",
    website: "https://www.feeleserehab.com",
    address: "402-405, Healthcare Hub, Vastrapur Ring Road, Surat",
    gstNumber: "24AABCS1429B1Z8",
  });

  // Schedule Rules
  const [schedule, setSchedule] = useState({
    workingDays: "Monday – Saturday",
    openTime: "08:30",
    closeTime: "19:30",
    sessionDuration: "45",
    bufferTime: "10",
  });

  // Clinical Protocols
  const [protocols, setProtocols] = useState({
    painScaleType: "VAS (0–10 Numeric Score)",
    mandatoryPrePostPain: true,
    reEvaluationCycle: "Every 4th Session",
    defaultPlanDuration: "8",
  });

  // Password State
  const [pwForm, setPwForm] = useState({ next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [pwMsg, setPwMsg]   = useState("");
  const [pending, start]    = useTransition();
  const [toast, setToast]   = useState("");

  const showSuccessToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const handlePwChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg("Passwords don't match.");
      return;
    }
    start(async () => {
      const res = await changePassword(pwForm.next);
      if (res?.error) {
        setPwMsg(`Error: ${res.error}`);
      } else {
        setPwMsg("Password updated successfully!");
        setPwForm({ next: "", confirm: "" });
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-lg">Clinic Settings</h1>
          <p className="body-sm mt-0.5">Configure facility details, operating rules, and role permissions.</p>
        </div>
        {toast && (
          <div className="px-3.5 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-pill text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
            <Check size={14} /> {toast}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-[#DDD5C7] p-1.5 rounded-pill w-fit">
        {[
          { key: "profile",  label: "Clinic Profile", icon: Building2 },
          { key: "schedule", label: "Operating Hours", icon: Clock },
          { key: "clinical", label: "Clinical Rules", icon: Activity },
          { key: "roles",    label: "Permissions Matrix", icon: Shield },
          { key: "security", label: "Admin Security", icon: Lock },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-pill text-xs font-semibold transition-all cursor-pointer ${
              tab === t.key
                ? "bg-white text-[#1A1A1A] shadow-card"
                : "text-[#4B4B4B] hover:text-[#1A1A1A]"
            }`}
          >
            <t.icon size={13} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Clinic Profile */}
      {tab === "profile" && (
        <div className="card-white p-6 space-y-4">
          <h3 className="heading-sm">Clinic Facility Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <F label="Facility Name">
              <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="input-base" />
            </F>
            <F label="Clinical Director">
              <input value={profile.director} onChange={(e) => setProfile({ ...profile, director: e.target.value })} className="input-base" />
            </F>
            <F label="Medical Registration No">
              <input value={profile.regNumber} onChange={(e) => setProfile({ ...profile, regNumber: e.target.value })} className="input-base" />
            </F>
            <F label="GST / Tax ID">
              <input value={profile.gstNumber} onChange={(e) => setProfile({ ...profile, gstNumber: e.target.value })} className="input-base" />
            </F>
            <F label="Primary Phone">
              <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="input-base" />
            </F>
            <F label="Reception Desk Phone">
              <input value={profile.receptionPhone} onChange={(e) => setProfile({ ...profile, receptionPhone: e.target.value })} className="input-base" />
            </F>
            <F label="Official Email">
              <input value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="input-base" />
            </F>
            <F label="Website">
              <input value={profile.website} onChange={(e) => setProfile({ ...profile, website: e.target.value })} className="input-base" />
            </F>
            <div className="sm:col-span-2">
              <F label="Address">
                <input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} className="input-base" />
              </F>
            </div>
          </div>
          <button
            type="button"
            onClick={() => showSuccessToast("Clinic profile settings saved!")}
            className="btn-primary text-xs"
          >
            Save Profile Changes
          </button>
        </div>
      )}

      {/* Tab: Schedule */}
      {tab === "schedule" && (
        <div className="card-white p-6 space-y-4">
          <h3 className="heading-sm">Operating Hours & Booking Protocol</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <F label="Working Days">
              <input value={schedule.workingDays} onChange={(e) => setSchedule({ ...schedule, workingDays: e.target.value })} className="input-base" />
            </F>
            <F label="Standard Session Duration (Minutes)">
              <input value={schedule.sessionDuration} onChange={(e) => setSchedule({ ...schedule, sessionDuration: e.target.value })} className="input-base" />
            </F>
            <F label="Opening Time">
              <input type="time" value={schedule.openTime} onChange={(e) => setSchedule({ ...schedule, openTime: e.target.value })} className="input-base" />
            </F>
            <F label="Closing Time">
              <input type="time" value={schedule.closeTime} onChange={(e) => setSchedule({ ...schedule, closeTime: e.target.value })} className="input-base" />
            </F>
          </div>
          <button
            type="button"
            onClick={() => showSuccessToast("Schedule rules saved!")}
            className="btn-primary text-xs"
          >
            Update Schedule Rules
          </button>
        </div>
      )}

      {/* Tab: Clinical Rules */}
      {tab === "clinical" && (
        <div className="card-white p-6 space-y-4">
          <h3 className="heading-sm">Clinical Governance Protocols</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <F label="Pain Evaluation Standard">
              <input value={protocols.painScaleType} onChange={(e) => setProtocols({ ...protocols, painScaleType: e.target.value })} className="input-base" />
            </F>
            <F label="Re-evaluation Cycle">
              <input value={protocols.reEvaluationCycle} onChange={(e) => setProtocols({ ...protocols, reEvaluationCycle: e.target.value })} className="input-base" />
            </F>
            <F label="Default Protocol Duration (Sessions)">
              <input value={protocols.defaultPlanDuration} onChange={(e) => setProtocols({ ...protocols, defaultPlanDuration: e.target.value })} className="input-base" />
            </F>
          </div>
          <button
            type="button"
            onClick={() => showSuccessToast("Clinical protocols saved!")}
            className="btn-primary text-xs"
          >
            Save Clinical Settings
          </button>
        </div>
      )}

      {/* Tab: Permissions Matrix */}
      {tab === "roles" && (
        <div className="card-white p-6 space-y-4">
          <div>
            <h3 className="heading-sm">Role-Based Access Control (RBAC) Matrix</h3>
            <p className="body-sm mt-0.5">Privileges granted to each clinical role.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Feature / Action</th>
                  <th>Administrator</th>
                  <th>Physiotherapist</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["View Clinic Dashboard & All Doctors", "Full Access", "Own Schedule Only"],
                  ["Manage & Register Patients", "Full Access", "Assigned Patients"],
                  ["Create / Edit Therapist Passwords", "Full Access", "Restricted"],
                  ["Log Therapy Sessions", "Full Access", "Full Access"],
                  ["Print Clinical Outcome Certificate", "Full Access", "Assigned Patients"],
                  ["Monthly Performance Reports", "All Doctors", "Own Monthly Report"],
                  ["Modify Global Settings", "Full Access", "Restricted"],
                ].map(([perm, admin, therapist], i) => (
                  <tr key={i}>
                    <td className="font-semibold text-[#1A1A1A]">{perm}</td>
                    <td>
                      <span className="badge-active">
                        {admin}
                      </span>
                    </td>
                    <td>
                      <span className={therapist === "Restricted" ? "badge-cancelled" : "badge-completed"}>
                        {therapist}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Security */}
      {tab === "security" && (
        <div className="card-white p-6 space-y-4">
          <div>
            <h3 className="heading-sm">Change Administrator Password</h3>
            <p className="body-sm mt-0.5">Update your account credentials for this device.</p>
          </div>

          <form onSubmit={handlePwChange} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  minLength={6}
                  value={pwForm.next}
                  onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                  placeholder="••••••••"
                  className="input-base pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#4B4B4B]"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">Confirm New Password</label>
              <input
                type={showPw ? "text" : "password"}
                required
                minLength={6}
                value={pwForm.confirm}
                onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                placeholder="••••••••"
                className="input-base"
              />
            </div>

            {pwMsg && (
              <p className={`text-xs p-3 rounded-xl border ${pwMsg.includes("Error") ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"}`}>
                {pwMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="btn-primary text-xs"
            >
              {pending ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">{label}</label>
      {children}
    </div>
  );
}
