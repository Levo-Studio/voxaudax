import type { NextConfig } from "next";

/**
 * Written here rather than read from CDN_BASE_URL, because this file is
 * evaluated at build time and the container is given its environment at run
 * time: reading it here would silently bake the fallback into the image and
 * every image request would 400 if the host were ever different. The runtime
 * URL is still built from CDN_BASE_URL — this constant only decides which host
 * next/image is permitted to load from, and that host is fixed.
 */
const CONTENT_DELIVERY_HOST = "cdn.levo-studio.com";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: CONTENT_DELIVERY_HOST }],
  },
  typedRoutes: true,
};

export default nextConfig;
