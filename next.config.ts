import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  typescript: {
    // Enforce strict typing in production build
    ignoreBuildErrors: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qsnfrcnkdrzodquaqnvk.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    // Router Cache: keep dynamic RSC payloads in client memory for 30s.
    // Navigation back to a page within 30s = instant (served from cache).
    // After 30s = stale-while-revalidate: shows cached instantly, fetches fresh in bg.
    // revalidatePath() in Server Actions invalidates the cache on mutations.
    staleTimes: {
      dynamic: 30,  // seconds — for pages with dynamic data (sessions, cases, etc.)
      static: 300,  // seconds — for static-ish pages (settings, profile)
    },
  },
};

export default nextConfig;
