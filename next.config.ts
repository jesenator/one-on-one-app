import type { NextConfig } from "next";

const shortlinks: Record<string, string> = {
  "/wc": "/join/west-coast-ea-2026",
  "/mw": "/join/midwest-ea-2026",
  "/ne": "/join/northeast-ea-2026",
};

const nextConfig: NextConfig = {
  async redirects() {
    return Object.entries(shortlinks).map(([source, destination]) => ({
      source,
      destination,
      permanent: false,
    }));
  },
};

export default nextConfig;
