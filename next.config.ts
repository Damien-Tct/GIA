import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ldapjs"],
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
};

export default nextConfig;

