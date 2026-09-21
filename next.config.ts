import type { NextConfig } from "next";

/**
 * The README says no request a reader's browser makes leaves this origin. A
 * sentence cannot enforce that; this can. Everything the page may load is this
 * origin, and the two exceptions are the ones the application itself produces:
 * `data:` fonts, which the font loader inlines, and `blob:` images, which the
 * share sheet builds in the browser.
 *
 * `'unsafe-inline'` stays on scripts because the framework serves its own
 * hydration payload as inline script tags and the article's structured-data
 * block is one as well. Replacing it with a nonce needs middleware on every
 * request, which would make every page dynamic and cost the whole static
 * cache — the trade the rest of this application is built around.
 */
/** Development rebuilds the page in the browser and needs eval to do it. */
const SCRIPT_SOURCES =
  process.env.NODE_ENV === "production"
    ? "'self' 'unsafe-inline'"
    : "'self' 'unsafe-inline' 'unsafe-eval'";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  `script-src ${SCRIPT_SOURCES}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "manifest-src 'self'",
].join("; ");

/**
 * HSTS is deliberately absent: TLS terminates at the reverse proxy, and a
 * max-age this application sets from behind it would be a promise it is not the
 * one keeping. It belongs in the proxy's own headers.
 */
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // frame-ancestors above says the same thing to anything from this decade.
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  typedRoutes: true,
  // No remotePatterns on purpose. Nothing in the bucket is public, so images
  // are read by the server and served from this origin; the browser is never
  // given the storage host to fetch from.
  headers: async () => [{ source: "/:path*", headers: SECURITY_HEADERS }],
};

export default nextConfig;
