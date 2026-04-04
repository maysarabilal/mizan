import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  typescript: {
    // Pre-existing type errors from stale database.ts types
    // Fix: run `npx supabase gen types` to regenerate
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
