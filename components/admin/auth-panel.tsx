import Link from "next/link";

import { BrandPanel } from "@/components/admin/brand-panel";

/**
 * The three pages that stand on their own — invitation, password forgotten, new
 * password. They have no navigation to sit under, so they borrow the two
 * columns of 7a: the violet panel on the left and the form centred in what is
 * left of the right.
 *
 * The panel is a desktop matter only. On a phone the right column is the whole
 * screen, and a band of violet above a form that is already the point would
 * push the first field below the fold — so at that width only the sign-in
 * screen keeps it, where it is the first thing anybody sees of the back office.
 *
 * Everything in the column shares one width. Nothing inside may set a width of
 * its own, or the column goes ragged.
 */
export function AuthPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-s1 text-tx md:grid-cols-[1.1fr_1fr]">
      <BrandPanel className="hidden md:flex" />

      <main className="flex flex-col items-center justify-center px-5 py-12 md:p-11">
        <div className="flex w-full max-w-[400px] flex-col">
          {/* The wordmark the panel already carries, for the width where the
              panel is not there. */}
          <Link
            href="/admin"
            className="flex items-baseline gap-[9px] no-underline md:hidden"
          >
            <span className="text-[19px] font-extrabold tracking-[-0.04em] text-ac">
              VOX AUDAX
            </span>
            <span className="text-[11px] font-bold tracking-[0.14em] text-tm uppercase">
              Redaktion
            </span>
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
