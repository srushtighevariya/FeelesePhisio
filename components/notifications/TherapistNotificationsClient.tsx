"use client";

import { useState, useTransition, useEffect } from "react";
import { Bell, Calendar, CheckCheck, MessageSquare, Smartphone, X, RefreshCw } from "lucide-react";
import { markNotificationRead } from "@/lib/actions/notifications";
import { createClient } from "@/lib/supabase/client";

const TYPE_CONFIG: Record<string, { label: string; bgClass: string; iconColor: string }> = {
  Appointment: { label: "Appointment", bgClass: "bg-blue-100",   iconColor: "text-blue-600" },
  WhatsApp:    { label: "WhatsApp",    bgClass: "bg-green-100",  iconColor: "text-[#25D366]" },
  SMS:         { label: "SMS",         bgClass: "bg-indigo-100", iconColor: "text-indigo-600" },
  Reminder:    { label: "Reminder",    bgClass: "bg-accent/15",  iconColor: "text-accent" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  return Math.floor(hrs / 24) + "d ago";
}

export function TherapistNotificationsClient({
  initialNotifications,
  therapistId,
}: {
  initialNotifications: any[];
  therapistId: string;
}) {
  const [list, setList] = useState(initialNotifications);
  const [, start] = useTransition();

  const unreadCount   = list.filter((n) => !n.is_read).length;
  const apptCount     = list.filter((n) => n.type === "Appointment").length;
  const reminderCount = list.filter((n) => n.type === "Reminder").length;

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("therapist-notifs-" + therapistId)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notification_log",
          filter: "recipient_therapist_id=eq." + therapistId,
        },
        (payload) => setList((prev) => [payload.new as any, ...prev])
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [therapistId]);

  const markRead = (id: string) => {
    setList((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    start(async () => { await markNotificationRead(id); });
  };

  const markAllRead = () => {
    const unread = list.filter((n) => !n.is_read);
    setList((prev) => prev.map((n) => ({ ...n, is_read: true })));
    start(async () => { await Promise.all(unread.map((n) => markNotificationRead(n.id))); });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 lg:pb-0">
      {/* Banner */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-blue-900 mb-0.5">Your Notification Inbox</p>
            <p className="text-xs text-blue-700 leading-relaxed">
              Appointment alerts, session reminders and clinic updates sent directly to you.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {unreadCount > 0 && (
              <span className="px-3 py-1 text-xs font-bold bg-accent text-white rounded-pill">
                {unreadCount} unread
              </span>
            )}
            <RefreshCw size={13} className="text-blue-500 animate-pulse" />
            <span className="text-xs text-blue-600 font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-white p-4 flex items-center gap-3 border border-[#E8E4DB]">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
            <Bell size={18} />
          </div>
          <div>
            <p className="text-xl font-bold text-[#1A1A1A]">{unreadCount}</p>
            <p className="text-xs text-[#9B9B9B]">Unread</p>
          </div>
        </div>
        <div className="card-white p-4 flex items-center gap-3 border border-[#E8E4DB]">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Calendar size={18} />
          </div>
          <div>
            <p className="text-xl font-bold text-[#1A1A1A]">{apptCount}</p>
            <p className="text-xs text-[#9B9B9B]">Appointment Alerts</p>
          </div>
        </div>
        <div className="card-white p-4 flex items-center gap-3 border border-[#E8E4DB]">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
            <Bell size={18} />
          </div>
          <div>
            <p className="text-xl font-bold text-[#1A1A1A]">{reminderCount}</p>
            <p className="text-xs text-[#9B9B9B]">Reminders</p>
          </div>
        </div>
      </div>

      {/* Notification list */}
      <div className="card-white p-0 overflow-hidden">
        <div className="p-4 border-b border-[#E8E4DB] flex items-center justify-between">
          <div>
            <h3 className="heading-sm text-sm">All Notifications</h3>
            <p className="text-xs text-[#9B9B9B] mt-0.5">{list.length} total</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs text-[#9B9B9B] hover:text-accent font-medium transition-colors cursor-pointer"
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
          )}
        </div>

        <div className="divide-y divide-[#F0EDE8]">
          {list.length === 0 ? (
            <div className="py-16 text-center">
              <Bell size={36} className="mx-auto text-[#D4CFC6] mb-3" />
              <p className="text-sm font-semibold text-[#1A1A1A]">No notifications yet</p>
              <p className="text-xs text-[#9B9B9B] mt-1">
                You will be notified when appointments are booked or reminders are sent.
              </p>
            </div>
          ) : (
            list.map((notif) => {
              const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG["Reminder"];
              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.is_read && markRead(notif.id)}
                  className={
                    "flex items-start gap-4 px-5 py-4 transition-colors " +
                    (!notif.is_read
                      ? "bg-accent/5 cursor-pointer hover:bg-accent/10"
                      : "hover:bg-[#F7F5F0]")
                  }
                >
                  <div className={"w-9 h-9 rounded-full " + cfg.bgClass + " flex items-center justify-center flex-shrink-0 mt-0.5"}>
                    {notif.type === "Appointment" ? (
                      <Calendar size={14} className={cfg.iconColor} />
                    ) : notif.type === "WhatsApp" ? (
                      <MessageSquare size={14} className={cfg.iconColor} />
                    ) : notif.type === "SMS" ? (
                      <Smartphone size={14} className={cfg.iconColor} />
                    ) : (
                      <Bell size={14} className={cfg.iconColor} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-pill bg-[#EDE9E1] text-[#4B4B4B]">
                        {cfg.label}
                      </span>
                      {notif.patients?.name && (
                        <span className="text-xs text-[#9B9B9B]">
                          {String.fromCharCode(8226)} {notif.patients.name}
                        </span>
                      )}
                    </div>
                    {notif.title && (
                      <p className="text-sm font-bold text-[#1A1A1A]">{notif.title}</p>
                    )}
                    <p className="text-xs text-[#4B4B4B] leading-relaxed mt-0.5">
                      {notif.message || "Clinic notification"}
                    </p>
                    <p className="text-[10px] text-[#9B9B9B] mt-1.5 font-mono">
                      {notif.sent_at
                        ? new Date(notif.sent_at).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Recent"}
                      {notif.sent_at ? " - " + timeAgo(notif.sent_at) : ""}
                    </p>
                  </div>
                  <div className="flex-shrink-0 mt-1">
                    {!notif.is_read ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-accent block" />
                    ) : (
                      <X size={12} className="text-[#D4CFC6]" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default TherapistNotificationsClient;
