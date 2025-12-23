import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Keeps the build going even if there are small type errors
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;