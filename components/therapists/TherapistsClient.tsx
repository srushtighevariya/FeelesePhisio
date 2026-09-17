"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Plus, Phone, Mail, Stethoscope, KeyRound, Check, X, Shield,
  Users, AlertCircle, UserCog
} from "lucide-react";
import { setTherapistPassword } from "@/lib/actions/therapists";
import { getInitials } from "@/lib/utils";

interface Therapist {
  id: string;
  user_id?: string;
  name: string;
  specialty?: string;
  phone?: string;
  email?: string;
  patient_count?: number;
  patients?: { count: number }[];
}

interface Props {
  therapists: Therapist[];
}

export function TherapistsClient({ therapists }: Props) {
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [pending, startTransition] = useTransition();
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  const handleOpenPasswordModal = (t: Therapist) => {
    setSelectedTherapist(t);
    setNewPassword("");
    setModalError("");
    setModalSuccess("");
    setPasswordModalOpen(true);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTherapist) return;
    setModalError("");
    setModalSuccess("");

    startTransition(async () => {
      try {
        await setTherapistPassword(selectedTherapist.id, newPassword);
        setModalSuccess(`Password successfully set for ${selectedTherapist.name}! They can now log in.`);
        setTimeout(() => {
          setPasswordModalOpen(false);
        }, 1800);
      } catch (err: any) {
        setModalError(err.message || "Failed to update password");
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-lg">Therapist Management</h1>
          <p className="body-sm mt-0.5">{therapists.length} registered physiotherapists & clinical doctors</p>
        </div>
        <Link
          href="/dashboard/therapists/new"
          id="add-therapist-btn"
          className="btn-primary"
        >
          <Plus size={15} /> Add New Therapist
        </Link>
      </div>

      {/* Doctor Grid */}
      {!therapists.length ? (
        <div className="card-white p-12 flex flex-col items-center text-center">
          <UserCog size={32} className="text-[#D4CFC6] mb-3" />
          <p className="heading-sm mb-1">No therapists registered</p>
          <p className="body-sm max-w-sm">Register clinic doctors to assign patients and manage schedules.</p>
          <Link href="/dashboard/therapists/new" className="btn-primary mt-5">
            <Plus size={15} /> Add Therapist
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {therapists.map((t) => {
            const ptCount = t.patients?.[0]?.count ?? t.patient_count ?? 0;
            return (
              <div
                key={t.id}
                className="card-white p-5 flex flex-col justify-between hover:shadow-panel transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-dark flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                        {getInitials(t.name)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#1A1A1A] text-sm leading-tight">{t.name}</h3>
                        <p className="text-xs text-[#9B9B9B] mt-0.5">{t.specialty || "Physical Therapist"}</p>
                      </div>
                    </div>
                    <span className="badge-completed text-[11px]">
                      Active
                    </span>
                  </div>

                  {/* Stats chip */}
                  <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-[#EDE9E1]/60 rounded-2xl border border-[#D4CFC6]/50">
                    <div>
                      <div className="text-[10px] font-bold text-[#9B9B9B] uppercase tracking-wider">Active Cases</div>
                      <div className="text-sm font-bold text-[#1A1A1A] mt-0.5">{ptCount} Patients</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[#9B9B9B] uppercase tracking-wider">Login Access</div>
                      <div className="text-xs font-bold text-[#1A1A1A] mt-1 flex items-center gap-1">
                        <Shield size={12} className="text-accent" /> {t.user_id ? "Active Auth" : "No Auth Set"}
                      </div>
                    </div>
                  </div>

                  {/* Contacts */}
                  <div className="space-y-1.5 text-xs text-[#4B4B4B] mb-4">
                    {t.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-[#9B9B9B] shrink-0" />
                        <span>{t.phone}</span>
                      </div>
                    )}
                    {t.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={13} className="text-[#9B9B9B] shrink-0" />
                        <span className="truncate">{t.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-[#E8E4DB] flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenPasswordModal(t)}
                    className="flex-1 btn-secondary text-xs !py-2"
                  >
                    <KeyRound size={13} className="text-accent" />
                    Set Password
                  </button>
                  <Link
                    href={`/dashboard/patients?doctor=${t.id}`}
                    className="btn-ghost text-xs !py-2"
                  >
                    <Users size={13} />
                    Patients
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Set Password Modal */}
      {passwordModalOpen && selectedTherapist && (
        <div className="fixed inset-0 bg-dark/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-white max-w-md w-full p-6 animate-fade-in shadow-panel border border-[#D4CFC6]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                  <KeyRound size={16} />
                </div>
                <div>
                  <h3 className="heading-sm text-[#1A1A1A]">Set Therapist Password</h3>
                  <p className="text-xs text-[#9B9B9B]">{selectedTherapist.name}</p>
                </div>
              </div>
              <button
                onClick={() => setPasswordModalOpen(false)}
                className="w-8 h-8 rounded-full text-[#9B9B9B] hover:text-[#1A1A1A] hover:bg-[#DDD5C7] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#4B4B4B] mb-4 leading-relaxed">
              Assign or update the login password for <b>{selectedTherapist.name}</b> ({selectedTherapist.email || "No email"}). 
              They can use this password to sign into their therapist portal.
            </p>

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="e.g. Doctor@2026"
                  className="input-base font-mono text-sm"
                />
                <p className="text-[10px] text-[#9B9B9B] mt-1">Minimum 6 characters.</p>
              </div>

              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {modalSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 flex items-center gap-2">
                  <Check size={14} className="shrink-0" />
                  <span>{modalSuccess}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="flex-1 btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 btn-primary text-xs"
                >
                  {pending ? "Updating…" : "Save Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default TherapistsClient;
