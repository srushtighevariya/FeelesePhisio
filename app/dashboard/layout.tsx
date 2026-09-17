import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Server-side auth guard
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get role from public.users
  const { data: profile } = await supabase
    .from("users")
    .select("name, role")
    .eq("id", user.id)
    .single();

  const profileData = profile as unknown as { name: string; role: string } | null;
  const role = (profileData?.role ?? "therapist") as "admin" | "therapist";
  let userName = profileData?.name ?? "";

  // Always resolve real doctor name for therapist users
  if (role === "therapist" || !userName || userName.toLowerCase() === "therapist" || userName.toLowerCase() === "admin") {
    const { data: therapist } = await supabase
      .from("therapists")
      .select("name")
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .maybeSingle();
    if (therapist?.name) {
      userName = therapist.name;
    }
  }

  // Never display literal 'therapist' or 'admin' as user's name
  if (!userName || userName.toLowerCase() === "therapist") {
    userName = role === "therapist" ? "Dr. Himanshu Nayak" : "Clinic Admin";
  } else if (userName.toLowerCase() === "admin") {
    userName = "Clinic Admin";
  }


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
    </div>
  );
}
