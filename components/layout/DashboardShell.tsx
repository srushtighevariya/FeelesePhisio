"use client";

import { useState } from "react";
import { TopBar } from "./TopBar";
import { ChatPanel } from "./ChatPanel";

interface Therapist {
  id: string;
  name: string;
  specialty?: string | null;
  user_id?: string | null;
}

interface DashboardShellProps {
  userName: string;
  role: "admin" | "therapist";
  currentTherapistId: string | null;
  currentUserId: string;
  isAdmin: boolean;
  therapists: Therapist[];
  children: React.ReactNode;
}

export function DashboardShell({
  userName,
  role,
  currentTherapistId,
  currentUserId,
  isAdmin,
  therapists,
  children,
}: DashboardShellProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden print:block print:overflow-visible min-w-0">
      <TopBar
        userName={userName}
        role={role}
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
        totalUnread={totalUnread}
      />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 print:overflow-visible print:p-0">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>

      <ChatPanel
        currentTherapistId={currentTherapistId}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
        therapists={therapists}
        currentUserName={userName}
        open={chatOpen}
        setOpen={setChatOpen}
        onUnreadChange={setTotalUnread}
      />
    </div>
  );
}
