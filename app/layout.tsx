import type { Metadata } from "next";

import { environment } from "@/lib/env";
import { fontVariables } from "@/lib/fonts";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(environment().NEXT_PUBLIC_SITE_URL),
  title: {
    default: "Vox Audax",
    template: "%s — Vox Audax",
  },
  description: "Schülerzeitung des Uhland-Gymnasiums",
  applicationName: "Vox Audax",
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/rss.xml" },
  },
  openGraph: {
    siteName: "Vox Audax",
    locale: "de_DE",
    type: "website",
  },
  // Nothing is tracked, so there is nothing to opt a reader out of.
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={fontVariables} suppressHydrationWarning>
      <head>
        <script
          // Must run before the first paint, so it cannot be a component.
          dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
