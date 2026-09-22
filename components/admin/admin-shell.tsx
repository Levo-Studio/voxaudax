import { ToastHost } from "@/components/admin/toast";
import Link from "next/link";
import type { ReactNode } from "react";

import { AdminNav, type NavItem } from "@/components/admin/admin-nav";
import { Avatar } from "@/components/admin/controls";
import { signOutAction } from "@/app/admin/actions";
import type { Member } from "@/lib/authorize";
import { countPendingReview } from "@/lib/editorial/articles";
import { may, ROLE_NAMES, roleLabel } from "@/lib/roles";

/**
 * The header of screens 7c, 11a, 10b, 6a, 8a and 8c, which are the same header.
 * A nav entry the role may not use is absent rather than disabled: screen 11a
 * says the author does not see the review page, and a greyed-out link would
 * still be telling them it is there.
 */
export async function AdminShell({
  member,
  children,
}: {
  member: Member;
  children: ReactNode;
}) {
  const canApprove = may(member.role, "approveArticlesAndMemes");

  const items: NavItem[] = [
    { href: "/admin/artikel", label: "Artikel" },
    ...(canApprove
      ? [{ href: "/admin/review", label: "Review", badge: await countPendingReview() } as const]
      : []),
    { href: "/admin/memes", label: "Memes" },
    { href: "/admin/unterstuetzer", label: "Unterstützer" },
    ...(may(member.role, "manageUsers") ? [{ href: "/admin/nutzer", label: "Nutzer" } as const] : []),
    { href: "/admin/konto", label: "Konto" },
  ];

  return (
    <div className="min-h-dvh bg-s2 text-tx">
      <ToastHost />
      <header className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-bd bg-s1 px-4 py-3.5 md:px-7">
        <Link href="/admin/artikel" className="flex items-baseline gap-[9px] no-underline">
          <span className="text-[17px] font-extrabold tracking-[-0.04em] text-ac">VOX AUDAX</span>
          <span className="text-xs font-bold tracking-[0.14em] text-tm uppercase">Redaktion</span>
        </Link>

        <AdminNav items={items} />

        <div className="ml-auto flex items-center gap-2.5 text-[12.5px] font-semibold">
          <span className="hidden rounded-full border border-bd bg-s2 px-2.5 py-[5px] text-tm sm:inline">
            Rolle {roleLabel(member.role, member.form)}
          </span>
          <span className="flex items-center gap-2">
            <Avatar initials={member.initials} />
            <span className="hidden md:inline">{member.name}</span>
          </span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="cursor-pointer border-none bg-transparent p-1 font-control text-[12.5px] font-semibold text-tm transition-colors duration-200 ease-out hover:text-tx"
            >
              Abmelden
            </button>
          </form>
        </div>
      </header>

      <main className="va-in px-4 pt-6 pb-9 md:px-7">{children}</main>
    </div>
  );
}

export const roleBadge = ROLE_NAMES;
