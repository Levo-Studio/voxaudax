import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  typedRoutes: true,
  // No remotePatterns on purpose. Nothing in the bucket is public, so images
  // are read by the server and served from this origin; the browser is never
  // given the storage host to fetch from.
};

export default nextConfig;
