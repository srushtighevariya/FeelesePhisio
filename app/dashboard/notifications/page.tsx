import { createClient } from "@/lib/supabase/server";
import { AdminNotificationsClient } from "@/components/notifications/NotificationsClient";
import { TherapistNotificationsClient } from "@/components/notifications/TherapistNotificationsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("users").select("role").eq("id", user.id).single()
    : { data: null };

  const isAdmin = profile?.role === "admin";

  // ── THERAPIST VIEW ─────────────────────────────────────────────────────────
  if (!isAdmin && user) {
    const { data: therapist } = await supabase
      .from("therapists")
      .select("id, name")
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .maybeSingle();

    const therapistId = therapist?.id ?? "";
    const therapistName = therapist?.name ?? "Therapist";

    const { data: notifications } = therapistId
      ? await supabase
          .from("notification_log")
          .select("*, patients(name)")
          .eq("recipient_therapist_id", therapistId)
          .order("sent_at", { ascending: false })
          .limit(50)
      : { data: [] };

    return (
      <div className="space-y-5 animate-fade-in">
        <div>
          <h2 className="text-xl font-black text-[#1A1A1A]">Notifications</h2>
          <p className="text-sm text-[#9B9B9B]">
            Your personal notification inbox · {therapistName}
          </p>
        </div>
        <TherapistNotificationsClient
          initialNotifications={notifications ?? []}
          therapistId={therapistId}
        />
      </div>
    );
  }

  // ── ADMIN VIEW ─────────────────────────────────────────────────────────────
  const [{ data: logs }, { data: patients }] = await Promise.all([
    supabase
      .from("notification_log")
      .select("*, patients(name), therapists(name)")
      .order("sent_at", { ascending: false })
      .limit(50),
    supabase.from("patients").select("id,name,phone").order("name"),
  ]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-black text-[#1A1A1A]">Clinic Notifications</h2>
        <p className="text-sm text-[#9B9B9B]">
          In-app notification log · WhatsApp &amp; SMS follow-up dispatch for patients
        </p>
      </div>
      <AdminNotificationsClient logs={logs ?? []} patients={patients ?? []} />
    </div>
  );
}
