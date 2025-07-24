import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Don't fail the build on ESLint warnings
    ignoreDuringBuilds: true, // Temporarily ignore ESLint during builds
  },
  typescript: {
    // Don't fail the build on TypeScript warnings
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
