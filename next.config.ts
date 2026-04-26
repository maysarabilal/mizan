import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  typescript: {
    // Enforce strict typing in production build
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
