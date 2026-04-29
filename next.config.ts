import type { NextConfig } from "next";

const raw = process.env.REDIRECTS || "{}";
let shortlinks: Record<string, string> = {};
try {
  shortlinks = JSON.parse(raw);
} catch {
  shortlinks = {};
}

const nextConfig: NextConfig = {
  async redirects() {
    return Object.entries(shortlinks).map(([key, destination]) => ({
      source: key.startsWith("/") ? key : `/${key}`,
      destination,
      permanent: false,
    }));
  },
};

export default nextConfig;
