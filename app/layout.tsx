import type { Metadata } from "next";

import { fontVariables } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vox Audax",
  description: "Schülerzeitung des Uhland-Gymnasiums",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
