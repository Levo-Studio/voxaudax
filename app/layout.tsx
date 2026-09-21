import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vox Audax",
  description: "Schülerzeitung des Uhland-Gymnasiums",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
