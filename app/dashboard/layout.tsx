import { redirect } from "next/navigation";
import { getCachedAuthUser } from "@/lib/auth-cache";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { ChatPanel } from "@/components/layout/ChatPanel";
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

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden print:block print:overflow-visible min-w-0">
        <TopBar userName={userName} role={role} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 print:overflow-visible print:p-0">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Chat Panel — floating */}
      <ChatPanel
        currentTherapistId={currentTherapistId}
        currentUserId={auth.user.id}
        isAdmin={isAdmin}
        therapists={therapists ?? []}
        currentUserName={userName}
      />
    </div>
  );
}
