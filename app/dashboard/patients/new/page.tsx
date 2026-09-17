"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addPatient } from "@/lib/actions/patients";
import { getTherapists, getCurrentTherapist } from "@/lib/actions/therapists";
import { ArrowLeft, UserPlus, Lock } from "lucide-react";
import Link from "next/link";

export default function NewPatientPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [therapists, setTherapists] = useState<any[]>([]);
  const [currentTherapist, setCurrentTherapist] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    getCurrentTherapist().then(({ isAdmin: admin, therapist }) => {
      setIsAdmin(admin);
      if (admin) {
        getTherapists().then((data) => setTherapists(data || [])).catch(() => {});
      } else {
        setCurrentTherapist(therapist);
      }
    }).catch(() => {
      setIsAdmin(false);
    });
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const assignedTherapistId = isAdmin
      ? ((fd.get("therapist_id") as string) || null)
      : (currentTherapist?.id || null);

    const form = {
      name:              fd.get("name") as string,
      age:               fd.get("age") ? Number(fd.get("age")) : null,
      gender:            (fd.get("gender") as string) || null,
      phone:             (fd.get("phone") as string) || null,
      email:             (fd.get("email") as string) || null,
      address:           (fd.get("address") as string) || null,
      emergency_contact: (fd.get("emergency_contact") as string) || null,
      referred_by:       (fd.get("referred_by") as string) || null,
      diagnosis:         (fd.get("diagnosis") as string) || null,
      therapist_id:      assignedTherapistId,
      status:            "Ongoing" as const,
    };

    startTransition(async () => {
      try {
        const patient = await addPatient(form) as any;
        router.push(`/dashboard/patients/${patient.id}`);
      } catch (err: any) {
        const msg = err?.message || (typeof err === "object" ? JSON.stringify(err) : String(err));
        setError(msg || "Failed to register patient");
      }
    });

  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in pb-20 lg:pb-0">
      <Link
        href="/dashboard/patients"
        className="btn-ghost text-xs mb-6 inline-flex"
      >
        <ArrowLeft size={14} /> Back to Patient Registry
      </Link>

      <div className="card-white p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E8E4DB]">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
            <UserPlus size={19} />
          </div>
          <div>
            <h1 className="heading-lg">Register New Patient</h1>
            <p className="body-sm">Enter clinical intake details to establish a medical recovery record.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                required
                placeholder="e.g. Ramesh Patel"
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">
                Age
              </label>
              <input
                name="age"
                type="number"
                min={1}
                max={120}
                placeholder="45"
                className="input-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">
                Gender
              </label>
              <select
                name="gender"
                className="input-base cursor-pointer"
              >
                <option value="">Select gender…</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">
                Contact Phone
              </label>
              <input
                name="phone"
                type="tel"
                placeholder="+91 98765 43210"
                className="input-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                placeholder="ramesh@gmail.com"
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">
                Emergency Contact
              </label>
              <input
                name="emergency_contact"
                placeholder="Spouse / Guardian: +91 98250 12345"
                className="input-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">
              Primary Diagnosis / Clinical Complaint
            </label>
            <input
              name="diagnosis"
              placeholder="e.g. Lumbar Disc Herniation L4-L5, Cervical Radiculopathy, Knee ACL Rehab"
              className="input-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">
                Assigned Physiotherapist <span className="text-red-500">*</span>
              </label>
              {isAdmin ? (
                <select
                  name="therapist_id"
                  className="input-base cursor-pointer"
                >
                  <option value="">Assign attending doctor…</option>
                  {therapists.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.specialty || "Physiotherapist"})
                    </option>
                  ))}
                </select>
              ) : currentTherapist ? (
                <div className="flex items-center gap-3 px-3.5 py-2 bg-[#F7F5F0] border border-[#D4CFC6] rounded-xl">
                  <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold flex-shrink-0">
                    {currentTherapist.name.replace(/^Dr\.\s*/i, "").charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#1A1A1A] truncate">{currentTherapist.name}</p>
                    <p className="text-[11px] text-[#9B9B9B] truncate">{currentTherapist.specialty || "Physiotherapist"}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[#9B9B9B] shrink-0">
                    <Lock size={12} />
                    <span className="text-[10px] font-medium">Auto-assigned</span>
                  </div>
                </div>
              ) : (
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#4B4B4B] flex items-center gap-1.5">
                  <Lock size={12} /> Auto-assigned to your clinical caseload
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">
                Referred By (Doctor / Hospital)
              </label>
              <input
                name="referred_by"
                placeholder="e.g. Dr. K. Mehta (Orthopedic)"
                className="input-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">
              Residential Address
            </label>
            <input
              name="address"
              placeholder="e.g. 102, Green Avenue, Surat"
              className="input-base"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-3">
            <Link
              href="/dashboard/patients"
              className="flex-1 btn-secondary text-xs"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 btn-primary text-xs"
            >
              {isPending ? "Registering…" : "Create Patient Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
