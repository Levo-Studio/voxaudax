import type { NextConfig } from "next";

const contentDeliveryHost = new URL(
  process.env.CDN_BASE_URL ?? "https://cdn.levo-studio.com",
).hostname;

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: contentDeliveryHost }],
  },
  typedRoutes: true,
};

export default nextConfig;
