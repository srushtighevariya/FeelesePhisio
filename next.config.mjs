/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "recharts"],
  },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
