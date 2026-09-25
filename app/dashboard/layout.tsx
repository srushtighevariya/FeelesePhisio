import { redirect } from "next/navigation";
import { getCachedAuthUser } from "@/lib/auth-cache";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getCachedAuthUser();

  if (!auth?.user) {
    redirect("/login");
  }

  const role = auth.role;
  const userName = auth.userName;
  const isAdmin = auth.isAdmin;
  const currentTherapistId = auth.therapistId;

  // Fetch therapist list for chat
  const supabase = await createClient();
  const { data: therapists } = await supabase
    .from("therapists")
    .select("id, name, specialty, user_id")
    .order("name");

  return (
    <div className="flex h-screen bg-page overflow-hidden print:block print:h-auto print:overflow-visible print:bg-white">
      {/* Sidebar */}
      <Sidebar role={role} name={userName} />

      {/* Main content + TopBar + Chat — all managed by DashboardShell */}
      <DashboardShell
        userName={userName}
        role={role}
        currentTherapistId={currentTherapistId}
        currentUserId={auth.user.id}
        isAdmin={isAdmin}
        therapists={therapists ?? []}
      >
        {children}
      </DashboardShell>
    </div>
  );
}
