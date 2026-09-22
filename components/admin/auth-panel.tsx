import Link from "next/link";

/**
 * The three pages that stand on their own — invitation, password forgotten, new
 * password. They have no navigation to sit under, so they sit in the middle of
 * the viewport instead, and everything in them shares this one column width.
 * Nothing inside may set a width of its own, or the column goes ragged.
 */
export function AuthPanel({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-s1 px-5 py-12 text-tx">
      <div className="flex w-full max-w-[400px] flex-col">
        <Link href="/admin" className="flex items-baseline gap-[9px] no-underline">
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
  );
}
