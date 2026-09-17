import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#EDE9E1]">
      <h1 className="text-6xl font-black text-[#16181D]">404</h1>
      <p className="text-[#4B4B4B] text-lg">Page not found.</p>
      <Link
        href="/dashboard"
        className="px-5 py-2.5 bg-[#F2924A] text-white rounded-xl font-semibold hover:bg-[#e07a35] transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
