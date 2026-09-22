export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse pb-20 lg:pb-0">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-[#DDD5C7]/70 rounded-xl" />
          <div className="h-4 w-72 bg-[#DDD5C7]/40 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-[#DDD5C7]/60 rounded-pill" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 bg-[#DDD5C7]/60 rounded-md" />
              <div className="w-8 h-8 rounded-full bg-[#DDD5C7]/50" />
            </div>
            <div className="h-8 w-16 bg-[#DDD5C7]/80 rounded-lg" />
            <div className="h-3 w-28 bg-[#DDD5C7]/40 rounded-md" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-white p-6 space-y-4">
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

        <div className="card-white p-6 space-y-4">
          <div className="h-5 w-32 bg-[#DDD5C7]/70 rounded-lg" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-[#F7F5F0] rounded-2xl space-y-2">
                <div className="h-4 w-24 bg-[#DDD5C7]/70 rounded" />
                <div className="h-3 w-full bg-[#DDD5C7]/40 rounded" />
                <div className="h-3 w-2/3 bg-[#DDD5C7]/30 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
