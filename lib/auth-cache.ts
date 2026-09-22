import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface CachedAuthData {
  user: any;
  profile: any;
  role: "admin" | "therapist";
  isAdmin: boolean;
  userName: string;
  therapist: any;
  therapistId: string | null;
}

/**
 * React request-cached helper that resolves the current user, role, and therapist profile.
 * When called multiple times in a single server request lifecycle (e.g. layout + page),
 * it runs only ONCE, eliminating redundant database round-trips and drastically speeding up page loads.
 */
export const getCachedAuthUser = cache(async (): Promise<CachedAuthData | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch role and name
  const { data: profile } = await supabase
    .from("users")
    .select("id, email, name, role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role ?? "therapist") as "admin" | "therapist";
  const isAdmin = role === "admin";
  let userName = profile?.name ?? "";

  let therapist: any = null;
  if (!isAdmin || !userName || userName.toLowerCase() === "therapist" || userName.toLowerCase() === "admin") {
    const { data: th } = await supabase
      .from("therapists")
      .select("id, name, specialty, email, phone")
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .maybeSingle();

    therapist = th;
    if (th?.name) {
      userName = th.name;
    }
  }

  // Sanitize fallback name
  if (!userName || userName.toLowerCase() === "therapist") {
    userName = role === "therapist" ? "Dr. Himanshu Nayak" : "Clinic Admin";
  } else if (userName.toLowerCase() === "admin") {
    userName = "Clinic Admin";
  }

  return {
    user,
    profile,
    role,
    isAdmin,
    userName,
    therapist,
    therapistId: therapist?.id || null,
  };
});
