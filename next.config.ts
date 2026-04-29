import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3001"],
    },
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
