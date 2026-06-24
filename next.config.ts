import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ldapjs"],
  experimental: {
    serverActions: {
      allowedOrigins: process.env.NODE_ENV === "production"
        ? (process.env.ALLOWED_ORIGINS?.split(",").map((s) => s.trim()) || [])
        : ["*"],
    },
  },
};

export default nextConfig;

