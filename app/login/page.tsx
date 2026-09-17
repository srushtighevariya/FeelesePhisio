"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Activity, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(authError.message || "Invalid email or password. Please try again.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-page flex">
      {/* ── Left panel — dark branding ── */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] bg-dark px-14 py-12">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
            <Activity size={18} color="#fff" strokeWidth={2} />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">
            FeelEase Physio
          </span>
        </div>

        {/* Middle — key stats */}
        <div className="space-y-10">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-4">
              Clinic Overview
            </p>
            <h1 className="text-white text-4xl font-bold leading-tight">
              Your complete<br />
              physiotherapy<br />
              management<br />
              platform.
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Patients managed", value: "Unlimited" },
              { label: "Session tracking", value: "Real-time" },
              { label: "Treatment plans", value: "Structured" },
              { label: "Progress reports", value: "Auto-generated" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/5 rounded-2xl px-4 py-4 border border-white/10"
              >
                <p className="text-white/40 text-xs mb-1">{stat.label}</p>
                <p className="text-white font-semibold text-sm">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-white/30 text-xs">
          © {new Date().getFullYear()} FeelEase Physio. All rights reserved.
        </p>
      </div>

      {/* ── Right panel — login form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
              <Activity size={16} color="#fff" strokeWidth={2} />
            </div>
            <span className="font-semibold text-lg">FeelEase Physio</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">
              Welcome back
            </h2>
            <p className="text-sm text-[#9B9B9B]">
              Sign in to your clinic dashboard
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6">
              <AlertCircle
                size={16}
                className="text-red-500 mt-0.5 flex-shrink-0"
              />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-[#4B4B4B] mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@recoverypath.com"
                className="input-base"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-[#4B4B4B] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-base pr-11"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B] hover:text-[#4B4B4B] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              id="btn-login"
              className="btn-primary w-full mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#D4CFC6] text-xs text-[#9B9B9B] space-y-1">
            <p className="font-medium text-[#4B4B4B]">Staff Quick Sign-In:</p>
            <p>Admin: <code className="bg-[#DDD5C7] px-1.5 py-0.5 rounded text-[#1A1A1A]">admin@recoverypath.com</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
