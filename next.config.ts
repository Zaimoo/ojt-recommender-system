import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Resume uploads can exceed the default 1 MB action payload.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
