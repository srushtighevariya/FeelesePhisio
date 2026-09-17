"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addTherapist } from "@/lib/actions/therapists";
import { ArrowLeft, KeyRound, Eye, EyeOff, UserPlus } from "lucide-react";
import Link from "next/link";

export default function NewTherapistPage() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      try {
        await addTherapist({
          name:      fd.get("name") as string,
          specialty: (fd.get("specialty") as string) || null,
          phone:     (fd.get("phone") as string) || null,
          email:     (fd.get("email") as string) || null,
          password:  (fd.get("password") as string) || null,
        });
        router.push("/dashboard/therapists");
      } catch (err: any) {
        setError(err.message ?? "Failed to add therapist");
      }
    });
  };

  return (
    <div className="max-w-xl mx-auto animate-fade-in pb-20 lg:pb-0">
      <Link
        href="/dashboard/therapists"
        className="btn-ghost text-xs mb-6 inline-flex"
      >
        <ArrowLeft size={14} /> Back to Staff Directory
      </Link>

      <div className="card-white p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E8E4DB]">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
            <UserPlus size={19} />
          </div>
          <div>
            <h1 className="heading-lg">Add New Therapist</h1>
            <p className="body-sm">Register a clinic physiotherapist and configure their login credentials.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              required
              placeholder="e.g. Dr. Sara Iqbal"
              className="input-base"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">
              Clinical Specialization
            </label>
            <input
              name="specialty"
              placeholder="e.g. Sports Rehabilitation, Musculoskeletal Physio"
              className="input-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">
                Phone Number
              </label>
              <input
                name="phone"
                type="tel"
                placeholder="+91 98765 10001"
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5">
                Work Email Address
              </label>
              <input
                name="email"
                type="email"
                placeholder="sara.iqbal@clinic.com"
                className="input-base"
              />
            </div>
          </div>

          {/* Password Section */}
          <div className="pt-3 border-t border-[#E8E4DB]">
            <label className="block text-xs font-semibold text-[#4B4B4B] mb-1.5 flex items-center gap-1.5">
              <KeyRound size={13} className="text-accent" />
              Set Initial Login Password
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                minLength={6}
                placeholder="Assign password (e.g. Doctor@2026)"
                className="input-base pr-11 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#4B4B4B] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="body-sm text-xs mt-1">
              If set, the therapist can log in immediately with their email and this password.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-3">
            <Link
              href="/dashboard/therapists"
              className="flex-1 btn-secondary text-xs"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 btn-primary text-xs"
            >
              {pending ? "Saving…" : "Register Therapist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
