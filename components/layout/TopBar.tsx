"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Bell, ChevronDown, CheckCheck, Calendar, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { markNotificationRead } from "@/lib/actions/notifications";

interface TopBarProps {
  userName: string;
  role: "admin" | "therapist";
  title?: string;
  name?: string;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getInitials(name: string) {
  return name
    .replace(/^Dr\.\s*/i, "")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function TopBar({ userName, role, name }: TopBarProps) {
  let effectiveName = userName || name || (role === "admin" ? "Clinic Admin" : "Dr. Himanshu");
  if (effectiveName.toLowerCase() === "therapist") {
    effectiveName = "Dr. Himanshu";
  } else if (effectiveName.toLowerCase() === "admin") {
    effectiveName = "Clinic Admin";
  }

  const router = useRouter();
  const [query, setQuery] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notification state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [therapistId, setTherapistId] = useState<string | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Load current therapist ID & initial notifications
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      if (role === "therapist") {
        const { data: th } = await supabase
          .from("therapists")
          .select("id")
          .or(`user_id.eq.${user.id},email.eq.${user.email}`)
          .maybeSingle();
        if (th?.id) {
          setTherapistId(th.id);
          // Load notifications
          const { data } = await supabase
            .from("notification_log")
            .select("*, patients(name)")
            .eq("recipient_therapist_id", th.id)
            .order("sent_at", { ascending: false })
            .limit(20);
          setNotifications(data ?? []);
        }
      } else {
        // Admin: load recent system notifications
        const { data } = await supabase
          .from("notification_log")
          .select("*, patients(name), therapists(name)")
          .order("sent_at", { ascending: false })
          .limit(10);
        setNotifications(data ?? []);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // Realtime subscription for therapist notifications
  useEffect(() => {
    if (!therapistId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`notif-${therapistId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notification_log",
          filter: `recipient_therapist_id=eq.${therapistId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [therapistId]);

  const handleMarkRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    await markNotificationRead(id);
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.is_read);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await Promise.all(unread.map((n) => markNotificationRead(n.id)));
  }, [notifications]);

  // Global search — debounced
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const sanitized = query.replace(/[,()%"'\\]/g, " ").trim();
        if (!sanitized) {
          setResults([]);
          setShowResults(false);
          return;
        }
        const supabase = createClient();
        const { data } = await supabase
          .from("patients")
          .select("id, name, phone, email, age, gender")
          .or(
            `name.ilike.%${sanitized}%,phone.ilike.%${sanitized}%,email.ilike.%${sanitized}%`
          )
          .limit(6);
        setResults(data ?? []);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdowns on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <header className="flex items-center justify-between h-16 px-6 lg:px-8 bg-page border-b border-[#D4CFC6] flex-shrink-0 print:hidden no-print">
      {/* Greeting */}
      <div className="hidden sm:block">
        <p className="text-sm font-semibold text-[#1A1A1A]">
          {getGreeting()}, {effectiveName.startsWith("Dr.") ? (effectiveName.split(" ").length > 2 ? effectiveName.split(" ").slice(0, 2).join(" ") : effectiveName) : (effectiveName || "Doctor")}
        </p>
        <p className="text-xs text-[#9B9B9B] capitalize">{role === "admin" ? "Clinic Admin" : "Physiotherapist"}</p>
      </div>


      {/* Global search */}
      <div ref={searchRef} className="relative flex-1 max-w-sm mx-4 lg:mx-8">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9B9B9B]"
          />
          <input
            id="global-search"
            type="text"
            placeholder="Search patients by name, phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && query.trim()) {
                setShowResults(false);
                router.push(`/dashboard/patients?q=${encodeURIComponent(query.trim())}`);
              }
            }}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-pill bg-[#DDD5C7] border border-[#C8C2B8] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors"
            autoComplete="off"
          />
          {searching && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <div className="w-3.5 h-3.5 border-2 border-accent/40 border-t-accent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Search results dropdown */}
        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-panel border border-[#E8E4DB] overflow-hidden z-50 animate-fade-in">
            {results.map((patient) => (
              <button
                key={patient.id}
                onClick={() => {
                  router.push(`/dashboard/patients/${patient.id}`);
                  setQuery("");
                  setShowResults(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#EDE9E1] transition-colors text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-[#DDD5C7] flex items-center justify-center text-xs font-semibold text-[#4B4B4B] flex-shrink-0">
                  {getInitials(patient.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">
                    {patient.name}
                  </p>
                  <p className="text-xs text-[#9B9B9B]">
                    {patient.phone || patient.email || `Age ${patient.age || "—"}`}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {showResults && results.length === 0 && !searching && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-panel border border-[#E8E4DB] px-4 py-3 z-50 animate-fade-in">
            <p className="text-sm text-[#9B9B9B]">No patients found for &quot;{query}&quot;</p>
          </div>
        )}
      </div>

      {/* Right — Notification Bell + Avatar */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifs((v) => !v)}
            className="w-9 h-9 rounded-full bg-[#DDD5C7] border border-[#C8C2B8] flex items-center justify-center hover:bg-[#CFC8BA] transition-colors relative"
            aria-label="Notifications"
          >
            <Bell size={16} className="text-[#4B4B4B]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-page">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown Feed */}
          {showNotifs && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-panel border border-[#E8E4DB] z-50 animate-fade-in overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E4DB]">
                <div className="flex items-center gap-2">
                  <Bell size={15} className="text-accent" />
                  <span className="text-sm font-bold text-[#1A1A1A]">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded-pill font-semibold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-[#9B9B9B] hover:text-accent flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck size={12} /> All read
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifs(false)}
                    className="w-5 h-5 flex items-center justify-center text-[#9B9B9B] hover:text-[#1A1A1A] cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Notification list */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell size={24} className="mx-auto text-[#D4CFC6] mb-2" />
                    <p className="text-xs text-[#9B9B9B]">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-[#F0EDE8] last:border-0 cursor-pointer hover:bg-[#F7F5F0] transition-colors ${!notif.is_read ? "bg-accent/5" : ""}`}
                      onClick={() => {
                        if (!notif.is_read) handleMarkRead(notif.id);
                      }}
                    >
                      {/* Icon */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${notif.type === "Appointment" ? "bg-blue-100 text-blue-600" : notif.type === "WhatsApp" ? "bg-green-100 text-green-600" : "bg-accent/15 text-accent"}`}>
                        {notif.type === "Appointment" ? <Calendar size={14} /> : <Bell size={14} />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {notif.title && (
                          <p className="text-xs font-bold text-[#1A1A1A] mb-0.5">{notif.title}</p>
                        )}
                        <p className="text-xs text-[#4B4B4B] leading-relaxed line-clamp-2">
                          {notif.message || "Clinic notification"}
                        </p>
                        <p className="text-[10px] text-[#9B9B9B] mt-1">
                          {timeAgo(notif.sent_at)}
                        </p>
                      </div>

                      {/* Unread dot */}
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-2" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {role === "admin" && (
                <div className="px-4 py-2.5 border-t border-[#E8E4DB]">
                  <Link
                    href="/dashboard/notifications"
                    className="text-xs font-semibold text-accent hover:underline"
                    onClick={() => setShowNotifs(false)}
                  >
                    View full notification log →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-2 cursor-default">
          <div className="w-9 h-9 rounded-full bg-dark flex items-center justify-center text-white text-xs font-semibold shadow-sm">
            {getInitials(effectiveName)}
          </div>
          <ChevronDown size={14} className="text-[#9B9B9B] hidden sm:block" />
        </div>
      </div>
    </header>
  );
}
export default TopBar;
