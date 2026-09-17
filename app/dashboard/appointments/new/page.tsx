"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addAppointment } from "@/lib/actions/appointments";
import { getCurrentTherapist } from "@/lib/actions/therapists";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, Calendar, Lock } from "lucide-react";

export default function NewAppointmentPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [therapists, setTherapists] = useState<any[]>([]);
  const [currentTherapist, setCurrentTherapist] = useState<{ id: string; name: string; specialty: string | null } | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null = loading

  useEffect(() => {
    const supabase = createClient();
    // Load patients
    supabase
      .from("patients")
      .select("id,name,code")
      .order("name")
      .then(({ data: ptsData }) => setPatients(ptsData ?? []));

    getCurrentTherapist().then(({ isAdmin: admin, therapist }) => {
      setIsAdmin(admin);
      if (admin) {
        supabase
          .from("therapists")
          .select("id,name,specialty")
          .order("name")
          .then(({ data: thData }) => setTherapists(thData ?? []));
      } else {
        setCurrentTherapist(therapist);
      }
    }).catch(() => {
      setIsAdmin(false);
    });
  }, []);

  const [selectedTime, setSelectedTime] = useState("10:00");

  const [timeWarning, setTimeWarning] = useState("");

  const handleTimeChange = (t: string) => {
    setSelectedTime(t);
    if (!t) {
      setTimeWarning("");
      return;
    }
    const [h, m] = t.split(":").map(Number);
    if (h < 8 || h >= 20) {
      setTimeWarning("⚠️ The selected time is outside hospital duty hours (08:00 AM – 08:00 PM). Doctors and physiotherapists are not on duty at midnight or night hours.");
    } else {
      setTimeWarning("");
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    const therapistId = isAdmin
      ? fd.get("therapist_id") as string
      : (currentTherapist?.id ?? "");

    if (!therapistId) {
      setError("No therapist found for your account. Please contact admin.");
      return;
    }

    const timeVal = (fd.get("time") as string) || selectedTime;
    if (timeVal) {
      const [h] = timeVal.split(":").map(Number);
      if (h < 8 || h >= 20) {
        setError(`Cannot schedule at ${timeVal}: Outside clinic attendance hours (08:00 AM – 08:00 PM). Therapists are not available at hospital at this time.`);
        return;
      }
    }

    const form = {
      patient_id:   fd.get("patient_id") as string,
      therapist_id: therapistId,
      date:         fd.get("date") as string,
      time:         timeVal || null,
      type:         (fd.get("type") as string) || "Manual Therapy & Exercise",
      status:       "Scheduled" as const,
      notes:        (fd.get("notes") as string) || null,
    };

    startTransition(async () => {
      try {
        await addAppointment(form);
        router.push("/dashboard/appointments");
      } catch (err: any) {
        setError(err.message ?? "Failed to book appointment");
      }
    });
  };

  const today = new Date().toISOString().slice(0, 10);


  // Show loading state
  if (isAdmin === null) {
    return (
      <div className="max-w-xl mx-auto animate-fade-in">
        <div className="card-white p-8 text-center text-[#9B9B9B] text-sm">
          Loading booking form…
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto animate-fade-in pb-20 lg:pb-0">
      <Link
        href="/dashboard/appointments"
        className="btn-ghost text-xs mb-6 inline-flex"
      >
        <ArrowLeft size={14} /> Back to Appointments
      </Link>

      <div className="card-white p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E8E4DB]">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
            <Calendar size={19} />
          </div>
          <div>
            <h1 className="heading-lg">Book Appointment</h1>
            <p className="body-sm">Schedule a clinic visit or therapy session for a patient.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">
              Select Patient <span className="text-red-500">*</span>
            </label>
            <select
              name="patient_id"
              required
              className="input-base cursor-pointer"
            >
              <option value="">Choose registered patient…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.code ? `(${p.code})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Therapist: Admin shows dropdown, Therapist shows locked field */}
          <div>
            <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">
              Attending Physiotherapist <span className="text-red-500">*</span>
            </label>

            {isAdmin ? (
              <select
                name="therapist_id"
                required
                className="input-base cursor-pointer"
              >
                <option value="">Assign a doctor / therapist…</option>
                {therapists.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.specialty || "Physical Therapist"})
                  </option>
                ))}
              </select>
            ) : currentTherapist ? (
              <div className="flex items-center gap-3 px-4 py-2.5 bg-[#F7F5F0] border border-[#D4CFC6] rounded-xl">
                <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold flex-shrink-0">
                  {currentTherapist.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1A1A1A]">{currentTherapist.name}</p>
                  <p className="text-xs text-[#9B9B9B]">{currentTherapist.specialty || "Physiotherapist"}</p>
                </div>
                <div className="flex items-center gap-1.5 text-[#9B9B9B]">
                  <Lock size={13} />
                  <span className="text-[10px] font-medium">Auto-assigned</span>
                </div>
              </div>
            ) : (
              <div className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                No therapist profile linked to your account. Contact admin.
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">
                Session Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                required
                defaultValue={today}
                className="input-base"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#4B4B4B]">
                  Time Slot <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-[#9B9B9B] font-medium">Clinic hours: 08:00 AM – 08:00 PM</span>
              </div>
              <input
                type="time"
                name="time"
                value={selectedTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                required
                className={`input-base font-mono ${timeWarning ? "border-amber-400 bg-amber-50/40" : ""}`}
              />
              {timeWarning && (
                <p className="text-[11px] font-medium text-amber-700 mt-1 leading-snug">
                  {timeWarning}
                </p>
              )}
            </div>
          </div>


          <div>
            <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">
              Treatment Modality / Type
            </label>
            <select
              name="type"
              className="input-base cursor-pointer"
            >
              <option value="Physiotherapy Initial Assessment">Initial Clinical Assessment</option>
              <option value="Manual Therapy & Joint Mobilization">Manual Therapy & Mobilization</option>
              <option value="Electrotherapy (IFT / TENS / Ultrasound)">Electrotherapy (IFT / TENS)</option>
              <option value="Spine Decompression & Traction">Spine Decompression & Traction</option>
              <option value="Therapeutic Exercise & Gym Rehab">Therapeutic Exercise & Rehab</option>
              <option value="Post-Surgical Follow-up">Post-Surgical Follow-up</option>
              <option value="Cancer Rehabilitation Session">Cancer Rehabilitation Session</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">
              Clinical Notes / Pre-visit Instructions
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="e.g. Patient reporting acute lower back spasm. Focus on gentle lumbar flexion."
              className="input-base resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-3">
            <Link
              href="/dashboard/appointments"
              className="flex-1 btn-secondary text-xs"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isPending || (!isAdmin && !currentTherapist)}
              className="flex-1 btn-primary text-xs"
            >
              {isPending ? "Scheduling…" : "Confirm Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
