import { ToastHost } from "@/components/admin/toast";
import Link from "next/link";
import type { ReactNode } from "react";

import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
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
    <div className="min-h-dvh bg-s1 text-tx md:bg-s2">
      <ToastHost />
      <header className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-bd bg-s1 px-4 py-3.5 md:px-7">
        <Link href="/admin/artikel" className="flex items-baseline gap-[9px] no-underline">
          <span className="text-[17px] font-extrabold tracking-[-0.04em] text-ac">VOX AUDAX</span>
          <span className="text-xs font-bold tracking-[0.14em] text-tm uppercase">Redaktion</span>
        </Link>

        {/* From `md` up the six entries fit in the row and everything is in
            front of you. Below it they did not: the row scrolled sideways and
            showed three of six, with the review queue — the one entry that
            carries a number — usually among the hidden. */}
        <div className="hidden min-w-0 flex-1 md:contents">
          <AdminNav items={items} />
        </div>

        <div className="ml-auto hidden items-center gap-2.5 text-[12.5px] font-semibold md:flex">
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
              className="inline-flex min-h-11 cursor-pointer items-center border-none bg-transparent px-1 font-control text-[12.5px] font-semibold text-tm transition-colors duration-200 ease-out hover:text-tx md:min-h-0 md:p-1"
            >
              Abmelden
            </button>
          </form>
        </div>

        <AdminMobileNav
          items={items}
          role={roleLabel(member.role, member.form)}
          name={member.name}
          signOut={signOutAction}
        />
      </header>

      {/* Edge to edge on a phone. The panels inside drop their radius and their
          side borders at the same width, so a list uses the screen it has
          instead of sitting in a card inside a margin inside a screen. */}
      {/* No gap above the first panel on a phone: with one background it was a
          stripe of nothing under the header, and the panel it belonged to
          looked like a second frame inside the screen. */}
      <main className="va-in pb-9 md:px-7 md:pt-6">{children}</main>
    </div>
  );
}

export const roleBadge = ROLE_NAMES;
