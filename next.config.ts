import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack (default in Next 16) config — empty = use defaults, silences the warning
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        // New Firebase Storage domain (used by projects created after 2024)
        protocol: "https",
        hostname: "*.firebasestorage.app",
      },
    ],
  },
};

// next-pwa v5 uses webpack. With Next 16 + Turbopack we skip the plugin
// in development; the manifest + service worker are served as static files.
// For production builds we still wrap with next-pwa (Vercel uses webpack for prod builds).
if (process.env.NODE_ENV === "production") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const withPWA = require("next-pwa")({
    dest: "public",
    register: true,
    skipWaiting: true,
  });
  module.exports = withPWA(nextConfig);
} else {
  module.exports = nextConfig;
}

export default nextConfig;
