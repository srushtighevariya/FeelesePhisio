"use client";

import { useState, useTransition, useRef } from "react";
import {
  User, Phone, Mail, Stethoscope, Check, Save, Camera,
  Lock, Eye, EyeOff, AlertCircle, Sparkles, BadgeCheck,
} from "lucide-react";
import { updateTherapistProfile } from "@/lib/actions/therapists";
import { changePassword } from "@/lib/actions/auth";

interface Therapist {
  id: string;
  name: string;
  specialty?: string | null;
  phone?: string | null;
  email?: string | null;
  user_id?: string | null;
}

interface Props {
  therapist: Therapist;
  patientCount?: number;
}

function getInitials(name: string) {
  return name
    .replace(/^Dr\.\s*/i, "")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "T";
}


export function TherapistProfileClient({ therapist, patientCount = 0 }: Props) {
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const [pending, start] = useTransition();

  // Profile form
  const [name, setName] = useState(therapist.name);
  const [specialty, setSpecialty] = useState(therapist.specialty || "");
  const [phone, setPhone] = useState(therapist.phone || "");
  const [email, setEmail] = useState(therapist.email || "");
  const [profileToast, setProfileToast] = useState("");
  const [profileError, setProfileError] = useState("");

  // Avatar
  const [avatarColor] = useState(() => {
    const colors = [
      "from-orange-400 to-amber-500",
      "from-emerald-400 to-teal-500",
      "from-blue-400 to-indigo-500",
      "from-purple-400 to-violet-500",
      "from-rose-400 to-pink-500",
    ];
    return colors[therapist.name.charCodeAt(0) % colors.length];
  });

  // Password form
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwToast, setPwToast] = useState("");
  const [pwError, setPwError] = useState("");

  const showToast = (setter: (v: string) => void, msg: string) => {
    setter(msg);
    setTimeout(() => setter(""), 4000);
  };

  const handleSaveProfile = () => {
    if (!name.trim()) {
      setProfileError("Name is required.");
      return;
    }
    setProfileError("");
    start(async () => {
      try {
        await updateTherapistProfile(therapist.id, {
          name: name.trim(),
          specialty: specialty.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
        });
        showToast(setProfileToast, "Profile updated successfully!");
      } catch (err: any) {
        setProfileError(err.message || "Failed to update profile.");
      }
    });
  };

  const handleChangePassword = () => {
    if (!newPw || newPw.length < 6) {
      setPwError("Password must be at least 6 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("Passwords do not match.");
      return;
    }
    setPwError("");
    start(async () => {
      try {
        await changePassword(newPw);
        setNewPw("");
        setConfirmPw("");
        showToast(setPwToast, "Password changed successfully!");
      } catch (err: any) {
        setPwError(err.message || "Failed to change password.");
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 lg:pb-0 max-w-4xl">
      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-dark shadow-xl">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative px-8 pt-8 pb-7 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="relative group flex-shrink-0">
            <div
              className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white text-3xl font-bold shadow-lg select-none`}
            >
              {getInitials(name)}
            </div>
            <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <Camera size={22} className="text-white" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-white text-xl font-bold truncate">{name}</h1>
              <BadgeCheck size={18} className="text-accent flex-shrink-0" />
            </div>
            <p className="text-white/60 text-sm font-medium">{specialty || "Physiotherapist"}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-white/70 text-xs">
                <Stethoscope size={13} className="text-accent" />
                <span>{patientCount} Active Patients</span>
              </div>
              {phone && (
                <div className="flex items-center gap-1.5 text-white/70 text-xs">
                  <Phone size={13} className="text-accent" />
                  <span>{phone}</span>
                </div>
              )}
              {email && (
                <div className="flex items-center gap-1.5 text-white/70 text-xs">
                  <Mail size={13} className="text-accent" />
                  <span className="truncate">{email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Badge */}
          <div className="hidden sm:flex flex-col items-end gap-2">
            <span className="px-3 py-1 bg-accent/20 border border-accent/30 text-accent text-xs font-bold rounded-full">
              Physiotherapist
            </span>
            <span className="px-3 py-1 bg-green-500/20 border border-green-400/30 text-green-300 text-xs font-semibold rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#DDD5C7] p-1.5 rounded-pill w-fit">
        {(["profile", "security"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-5 py-2 rounded-pill text-xs font-semibold capitalize transition-all cursor-pointer ${
              activeTab === t
                ? "bg-white text-[#1A1A1A] shadow-card"
                : "text-[#4B4B4B] hover:text-[#1A1A1A]"
            }`}
          >
            {t === "profile" ? "Edit Profile" : "Security"}
          </button>
        ))}
      </div>

      {activeTab === "profile" ? (
        <div className="card-white p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center">
              <User size={16} className="text-accent" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1A1A1A]">Personal Information</h2>
              <p className="text-xs text-[#9B9B9B]">Update your professional profile details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Himanshu Nayak"
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#D4CFC6] rounded-xl text-sm font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                />
              </div>
            </div>

            {/* Specialty */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">
                Specialty / Expertise
              </label>
              <div className="relative">
                <Stethoscope size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] pointer-events-none" />
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="e.g. Orthopedic Physiotherapy, Sports Injury…"
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#D4CFC6] rounded-xl text-sm font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B]" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#D4CFC6] rounded-xl text-sm font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@clinic.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#D4CFC6] rounded-xl text-sm font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                />
              </div>
            </div>
          </div>

          {profileError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle size={13} className="shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          {profileToast && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 flex items-center gap-2 animate-fade-in">
              <Check size={13} className="shrink-0" />
              <span>{profileToast}</span>
            </div>
          )}

          <div className="pt-2 border-t border-[#E8E4DB] flex items-center justify-between">
            <p className="text-[11px] text-[#9B9B9B]">
              Changes will reflect across the portal immediately
            </p>
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={pending}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              {pending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={13} />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Security Tab */
        <div className="card-white p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
              <Lock size={16} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1A1A1A]">Change Password</h2>
              <p className="text-xs text-[#9B9B9B]">Update your login credentials</p>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
            <Sparkles size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Choose a strong password with at least 6 characters. Your account is associated with{" "}
              <strong>{email || "your registered email"}</strong>.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B]" />
                <input
                  type={showPw ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full pl-9 pr-10 py-2.5 bg-white border border-[#D4CFC6] rounded-xl text-sm font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#1A1A1A] cursor-pointer"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B]" />
                <input
                  type={showPw ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#D4CFC6] rounded-xl text-sm font-medium text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
                />
              </div>
              {/* Strength indicator */}
              {newPw && (
                <div className="mt-1.5 flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        newPw.length >= i * 4
                          ? newPw.length >= 10
                            ? "bg-green-400"
                            : newPw.length >= 6
                            ? "bg-amber-400"
                            : "bg-red-400"
                          : "bg-[#E8E4DB]"
                      }`}
                    />
                  ))}
                  <span className="text-[10px] text-[#9B9B9B] ml-1">
                    {newPw.length < 6 ? "Weak" : newPw.length < 10 ? "Fair" : "Strong"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {pwError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle size={13} className="shrink-0" />
              <span>{pwError}</span>
            </div>
          )}

          {pwToast && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 flex items-center gap-2 animate-fade-in">
              <Check size={13} className="shrink-0" />
              <span>{pwToast}</span>
            </div>
          )}

          <div className="pt-2 border-t border-[#E8E4DB] flex justify-end">
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={pending || !newPw}
              className="btn-primary text-xs flex items-center gap-1.5 !bg-red-600 hover:!bg-red-700"
            >
              {pending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating…
                </>
              ) : (
                <>
                  <Lock size={13} />
                  Update Password
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TherapistProfileClient;
