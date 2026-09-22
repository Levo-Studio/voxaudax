import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * The backoffice answers no reader's question, and the invitation and password
 * addresses carry a secret in the path. Stated once for the whole tree rather
 * than on each of the pages, so a page added here cannot be the one that
 * forgets it.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
