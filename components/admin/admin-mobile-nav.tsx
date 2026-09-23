"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { NavItem } from "@/components/admin/admin-nav";

/**
 * The back office navigation on a phone: a hamburger and a sheet over the whole
 * screen, the same gesture as the public site's.
 *
 * It was a row that scrolled sideways, which on a 390px screen showed three of
 * six entries and hid the rest behind a swipe nobody knows is there — including
 * the review queue, which is the one entry that carries a number.
 *
 * The role, the name and "Abmelden" come along: they were squeezed into the
 * same header row, and the sheet has room to set them out properly.
 */
export function AdminMobileNav({
  items,
  role,
  name,
  signOut,
}: {
  items: readonly NavItem[];
  role: string;
  name: string;
  signOut: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    panel.current?.querySelector("a")?.focus();

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    button.current?.focus();
  };

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="redaktionsnavigation-mobil"
        aria-label={open ? "Menü schließen" : "Menü öffnen"}
        className="relative z-60 -mr-1 ml-auto inline-flex size-11 items-center justify-center text-tx md:hidden"
      >
        <span aria-hidden className="relative block h-[15px] w-[22px]">
          {[
            open ? "top-[6.5px] rotate-45" : "top-0",
            open ? "opacity-0" : "top-[6.5px] opacity-100",
            open ? "top-[6.5px] -rotate-45" : "top-[13px]",
          ].map((placement, rule) => (
            <span
              key={rule}
              className={`absolute left-0 block h-[2px] w-full rounded-full bg-current transition-all duration-300 ease-out ${placement}`}
            />
          ))}
        </span>
      </button>

      <div
        id="redaktionsnavigation-mobil"
        ref={panel}
        inert={!open}
        className={`fixed inset-0 z-50 flex flex-col bg-s1 transition-[opacity,visibility,translate] duration-300 ease-out md:hidden ${
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
        }`}
      >
        <span
          aria-hidden
          className="flex items-baseline gap-[9px] px-4 py-[15px]"
        >
          <span className="text-[17px] font-extrabold tracking-[-0.04em] text-ac">VOX AUDAX</span>
          <span className="text-xs font-bold tracking-[0.14em] text-tm uppercase">Redaktion</span>
        </span>

        <nav
          aria-label="Redaktionsnavigation"
          className="flex flex-1 flex-col justify-center gap-0.5 px-4 pb-6"
        >
          {items.map((item, position) => {
            const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                aria-current={current ? "page" : undefined}
                style={{ transitionDelay: open ? `${70 + position * 40}ms` : "0ms" }}
                className={`inline-flex min-h-14 items-center gap-2 text-[26px] leading-none font-extrabold tracking-[-0.04em] no-underline transition-[opacity,translate] duration-300 ease-out ${
                  open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                } ${current ? "text-ac" : "text-tx"}`}
              >
                {item.label}
                {item.badge !== undefined && item.badge > 0 ? (
                  <span className="rounded-full bg-ac px-2 py-0.5 text-[13px] font-bold text-s1">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 border-t border-bd px-4 py-4 text-[13px] font-semibold">
          <span className="min-w-0">
            <span className="block truncate font-bold">{name}</span>
            <span className="block text-tm">Rolle {role}</span>
          </span>
          <form action={signOut} className="ml-auto">
            <button
              type="submit"
              className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-bd bg-transparent px-3.5 font-control text-[13px] font-bold text-tm transition-colors duration-200 ease-out hover:text-tx"
            >
              Abmelden
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
