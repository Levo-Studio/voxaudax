"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef, useState } from "react";

/**
 * The navigation on a phone, behind a hamburger and over the whole screen.
 *
 * It used to be a strip under the header that scrolled sideways and stood there
 * on every page, eating a row of screen before the first headline. A button and
 * a sheet give that row back and put the five destinations at a readable size.
 *
 * Animated in CSS rather than in a library: the entrance of this template is
 * `vaIn` in `globals.css`, at the template's own values, and everything here
 * moves the same two properties it does. The panel stays mounted and is turned
 * off with `inert` and `visibility`, so closing is a transition rather than an
 * unmount — a sheet that vanishes on the frame it is dismissed reads as a
 * mistake.
 */
export function MobileMenu({
  items,
  current,
}: {
  items: ReadonlyArray<{ key: string; label: string; href: string }>;
  current?: string;
}) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    // Escape closes it, because a sheet over the whole screen has to have a way
    // out that is not a hunt for the button.
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    // The page underneath must not scroll while the sheet is over it.
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);

    // Into the sheet, so the next Tab is a destination and not the page behind.
    panel.current?.querySelector("a")?.focus();

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /** Back to the control that opened it — otherwise focus falls to the top. */
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
        aria-controls="hauptnavigation-mobil"
        aria-label={open ? "Menü schließen" : "Menü öffnen"}
        className="relative z-60 -mr-1.5 inline-flex size-11 items-center justify-center text-tx md:hidden"
      >
        {/* Three rules that become a cross: the middle one fades, the outer two
            meet in the centre and turn. */}
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
        id="hauptnavigation-mobil"
        ref={panel}
        // Out of the tab order and out of the accessibility tree while closed,
        // which `hidden` would do too — but `hidden` cannot be transitioned.
        inert={!open}
        className={`fixed inset-0 z-50 flex flex-col bg-s1 transition-[opacity,visibility,translate] duration-300 ease-out md:hidden ${
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"
        }`}
      >
        {/* The sheet covers the header, so the wordmark comes with it —
            otherwise the top-left corner goes blank for the length of the
            animation and the page looks as though it has been replaced. */}
        <span
          aria-hidden
          className="px-[18px] py-[15px] text-[18px] font-extrabold tracking-[-0.04em] text-ac"
        >
          VOX AUDAX
        </span>

        <nav
          aria-label="Hauptnavigation"
          className="flex flex-1 flex-col justify-center gap-1 px-[18px]"
        >
          {items.map((item, position) => (
            <Link
              key={item.key}
              href={item.href as Route}
              onClick={close}
              aria-current={item.key === current ? "page" : undefined}
              // Staggered, so the five arrive as a list rather than a block.
              style={{ transitionDelay: open ? `${80 + position * 45}ms` : "0ms" }}
              className={`inline-flex min-h-14 items-center text-[30px] leading-none font-extrabold tracking-[-0.04em] transition-[opacity,translate] duration-300 ease-out ${
                open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
              } ${item.key === current ? "text-ac" : "text-tx"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Set apart from the five, and quieter: the back office is not a
            sixth destination of the newspaper, it is the door beside it. The
            five above are where a reader goes; this is where the people who
            write it go. */}
        <div className="border-t border-bd px-[18px] py-5">
          <Link
            href="/admin"
            onClick={close}
            style={{ transitionDelay: open ? "305ms" : "0ms" }}
            className={`inline-flex min-h-11 items-center gap-2 text-[15px] font-bold text-tm transition-[opacity,translate,color] duration-300 ease-out hover:text-tx ${
              open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            }`}
          >
            Anmelden
            <span aria-hidden className="text-[13px]">
              →
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}
