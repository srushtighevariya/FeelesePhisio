import { redirect } from "next/navigation";
import { getCachedAuthUser } from "@/lib/auth-cache";
import { createClient } from "@/lib/supabase/server";
import { TherapistProfileClient } from "@/components/therapists/TherapistProfileClient";
import { UserCog } from "lucide-react";

export default async function ProfilePage() {
  const auth = await getCachedAuthUser();

  // Only therapists can access their profile here
  if (!auth?.user) redirect("/login");
  if (auth.isAdmin) redirect("/dashboard/settings");

  const supabase = await createClient();

  // Fetch full therapist record
  const { data: therapist } = await supabase
    .from("therapists")
    .select("id, name, specialty, phone, email, user_id")
    .or(`user_id.eq.${auth.user.id},email.eq.${auth.user.email}`)
    .maybeSingle();

  if (!therapist) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#DDD5C7] flex items-center justify-center mb-4">
          <UserCog size={28} className="text-[#9B9B9B]" />
        </div>
        <h2 className="text-base font-bold text-[#1A1A1A] mb-1">Profile not found</h2>
        <p className="text-sm text-[#9B9B9B] max-w-xs">
          Your therapist profile could not be loaded. Please contact your clinic admin.
        </p>
      </div>
    );
  }

  // Get patient count
  const { count } = await supabase
    .from("patients")
    .select("id", { count: "exact", head: true })
    .eq("therapist_id", therapist.id);

  return (
    <TherapistProfileClient
      therapist={therapist}
      patientCount={count ?? 0}
    />
  );
}
