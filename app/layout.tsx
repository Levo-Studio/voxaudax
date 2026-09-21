import type { Metadata } from "next";

import { fontVariables } from "@/lib/fonts";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vox Audax",
  description: "Schülerzeitung des Uhland-Gymnasiums",
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
