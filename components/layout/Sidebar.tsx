"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  UserCog,
  Bell,
  Settings,
  LogOut,
  Activity,
  AlertTriangle,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",              label: "Dashboard",       icon: LayoutDashboard },
  { href: "/dashboard/patients",     label: "Patients",        icon: Users },
  { href: "/dashboard/appointments", label: "Appointments",    icon: Calendar },
  { href: "/dashboard/calendar",     label: "Calendar",        icon: CalendarDays },
  { href: "/dashboard/exercises",    label: "Exercises",       icon: Dumbbell },
  { href: "/dashboard/attendance",   label: "Attendance",      icon: ClipboardList },
  { href: "/dashboard/reports",      label: "Reports",         icon: Activity },
  { href: "/dashboard/therapists",   label: "Therapists",      icon: UserCog, adminOnly: true },
  { href: "/dashboard/notifications",label: "Notifications",   icon: Bell },
  { href: "/dashboard/settings",     label: "Settings",        icon: Settings, adminOnly: true },

];

interface SidebarProps {
  role: "admin" | "therapist";
  name?: string;
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

export function Sidebar({ role, name }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  let displayName = name || (role === "admin" ? "Clinic Admin" : "Dr. Himanshu");
  if (displayName.toLowerCase() === "therapist") {
    displayName = "Dr. Himanshu";
  } else if (displayName.toLowerCase() === "admin") {
    displayName = "Clinic Admin";
  }


  const visibleItems = NAV_ITEMS.filter((item) =>
    item.adminOnly ? role === "admin" : true
  );

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const NavLinks = () => (
    <>
      {visibleItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${isActive ? "nav-item-active bg-white/10 !text-white font-semibold" : ""}`}
          >
            <item.icon size={17} strokeWidth={1.8} className="flex-shrink-0" />
            <span className="truncate">{item.label}</span>
            {isActive && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
            )}
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex print:hidden flex-col w-[220px] bg-dark h-screen py-6 px-4 flex-shrink-0 select-none">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-2 mb-8">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
            <Activity size={16} color="#fff" strokeWidth={2.2} />
          </div>
          <span className="text-white font-semibold text-sm tracking-tight">
            FeelEase Physio
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          <NavLinks />
        </nav>

        {/* User info + logout */}
        <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
          {/* User identity pill — shows actual name + role */}
          <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-accent/30 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                {getInitials(displayName)}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">{displayName}</p>
                <p className={`text-[10px] font-medium ${role === "admin" ? "text-accent" : "text-white/50"}`}>
                  {role === "admin" ? "Clinic Admin" : "Physiotherapist"}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            id="btn-logout"
            className="nav-item w-full text-left text-red-400 hover:!text-red-300 hover:!bg-red-500/10 cursor-pointer"
          >
            <LogOut size={16} strokeWidth={1.8} className="flex-shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav className="lg:hidden print:hidden fixed bottom-0 left-0 right-0 bg-dark border-t border-white/10 z-50 px-2 py-2">
        <div className="flex justify-around items-center">
          {visibleItems.slice(0, 5).map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors ${
                  isActive ? "text-accent font-semibold" : "text-white/40"
                }`}
              >
                <item.icon size={19} strokeWidth={1.8} />
                <span className="text-[10px] font-medium">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Sign-Out Confirmation Modal ── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E8E4DB] max-w-sm w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A1A]">Sign Out?</h3>
                  <p className="text-xs text-[#9B9B9B] mt-0.5">You will be logged out of your session.</p>
                </div>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-6 h-6 flex items-center justify-center text-[#9B9B9B] hover:text-[#1A1A1A] cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-3 bg-[#F7F5F0] rounded-xl border border-[#E8E4DB]">
              <p className="text-xs text-[#4B4B4B]">
                Signed in as <strong>{displayName}</strong> ({role === "admin" ? "Clinic Admin" : "Physiotherapist"})
              </p>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 px-4 bg-[#EDE9E1] hover:bg-[#DDD5C7] text-[#1A1A1A] text-xs font-semibold rounded-pill transition-colors cursor-pointer"
              >
                Cancel — Stay Signed In
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-pill transition-colors cursor-pointer"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export default Sidebar;
