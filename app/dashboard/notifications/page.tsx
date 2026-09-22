import { createClient } from "@/lib/supabase/server";
import { AdminNotificationsClient } from "@/components/notifications/NotificationsClient";
import { TherapistNotificationsClient } from "@/components/notifications/TherapistNotificationsClient";
import { getCachedAuthUser } from "@/lib/auth-cache";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const auth = await getCachedAuthUser();
  const isAdmin = auth?.isAdmin ?? false;
  const therapistId = auth?.therapistId ?? "";
  const therapistName = auth?.userName ?? "Therapist";

  const supabase = await createClient();

  // ── THERAPIST VIEW ─────────────────────────────────────────────────────────
  if (!isAdmin && auth?.user) {
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
