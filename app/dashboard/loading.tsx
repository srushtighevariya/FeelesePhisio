// Generic loading indicator — appears on any dashboard route transition.
// Intentionally minimal (top bar + neutral pulse) to avoid flashing a
// misleading layout (e.g. metric cards) when loading Calendar, Reports,
// Patient Profile, Attendance, or other non-dashboard-home pages.
export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-5 pb-20 lg:pb-0">
      {/* Page header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-56 bg-[#DDD5C7]/70 rounded-xl" />
          <div className="h-4 w-80 bg-[#DDD5C7]/40 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-[#DDD5C7]/60 rounded-pill" />
      </div>

      {/* Generic content area skeleton */}
      <div className="card-white p-6 space-y-4">
        <div className="h-5 w-40 bg-[#DDD5C7]/70 rounded-lg" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3.5 bg-[#F7F5F0] rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#DDD5C7]/60" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 bg-[#DDD5C7]/70 rounded" />
                  <div className="h-3 w-20 bg-[#DDD5C7]/40 rounded" />
                </div>
              </div>
              <div className="h-6 w-20 bg-[#DDD5C7]/50 rounded-pill" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
