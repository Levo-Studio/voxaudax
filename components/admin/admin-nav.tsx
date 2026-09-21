"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";

export type NavItem = {
  readonly href: Route;
  readonly label: string;
  readonly badge?: number;
};

export function AdminNav({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Redaktionsnavigation"
      className="-mx-1 flex min-w-0 flex-1 gap-4 overflow-x-auto px-1 text-[13px] font-semibold"
    >
      {items.map((item) => {
        const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={`flex-none py-1 no-underline transition-colors duration-200 ease-out ${
              current ? "text-tx shadow-[inset_0_-3px_0_var(--ac)]" : "text-tm hover:text-tx"
            }`}
          >
            {item.label}
            {item.badge !== undefined && item.badge > 0 ? (
              <span className="ml-[3px] inline-block rounded-full bg-ac px-1.5 py-px text-[10.5px] font-bold text-white">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
