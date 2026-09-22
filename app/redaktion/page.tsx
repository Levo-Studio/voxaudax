import type { Metadata } from "next";
import { Suspense } from "react";

import { Avatar, toneForPosition } from "@/components/avatar";
import { Inline } from "@/components/prose";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { MembersSkeleton } from "@/components/skeleton";
import { splitEditorialPage } from "@/lib/editorial-page";
import { editorialAddress } from "@/lib/env";
import { toSlug } from "@/lib/format";
import { alternates } from "@/lib/metadata";
import { editorialMembers, orNoneAtBuildTime, pageBySlug } from "@/lib/queries";
import { roleTitle } from "@/lib/roles";
import { archiveHref } from "@/lib/routes";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Die Redaktion",
  description:
    "Wer die Vox Audax schreibt, worüber, und wie man mitmacht.",
  alternates: alternates("/redaktion"),
};

/**
 * Rendered for every request. Prerendering built this page inside an image with
 * no route to the database, so what got baked in was its empty state — the note
 * on `app/page.tsx` has the whole of it. The shell goes out first and the query
 * follows into a skeleton.
 */
export const dynamic = "force-dynamic";

export default function EditorialPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader current="redaktion" />

      <main className="max-w-[900px] flex-1 px-[18px] pt-[22px] pb-7 md:px-10 md:pt-10 md:pb-12">
        <Suspense fallback={<MembersSkeleton />}>
          <EditorialContent />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
}

async function EditorialContent() {
  const [page, members] = await Promise.all([
    orNoneAtBuildTime(pageBySlug("redaktion"), undefined),
    orNoneAtBuildTime(editorialMembers(), []),
  ]);

  const { intro, invitation, note } = splitEditorialPage(page?.body.content ?? []);
  const editorialEmail = editorialAddress();

  return (
    <>
      <h1 className="text-[30px] leading-[1.02] font-extrabold tracking-[-0.04em] md:text-[46px] md:leading-none">
          {page?.title ?? "Die Redaktion"}
        </h1>

        {intro.map((node, index) => (
          <p
            key={index}
            className="mt-2.5 text-[15.5px] leading-[1.6] font-medium text-tm md:mt-3 md:max-w-[58ch] md:text-[17.5px] md:leading-[1.65]"
          >
            <Inline node={node} />
          </p>
        ))}

        <div className="mt-[22px] md:mt-8">
          {members.map((member, position) => (
            <article
              key={member.email}
              className="grid grid-cols-[48px_1fr] gap-3.5 border-t border-bd py-[18px] md:grid-cols-[64px_1fr] md:gap-[18px] md:py-6"
            >
              <Avatar
                initials={member.initials}
                size="member"
                tone={toneForPosition(position)}
              />
              <div>
                <h2 className="text-[17.5px] font-bold tracking-[-0.02em] md:text-[21px] md:tracking-[-0.025em]">
                  {member.name}
                </h2>
                <div className="mt-0.5 text-[11px] font-bold tracking-[0.1em] text-ac uppercase md:mt-[3px] md:text-xs">
                  {roleTitle(member.role, member.form)}
                </div>
                {member.bio === null ? null : (
                  <p className="mt-2 text-[14.5px] leading-[1.6] font-medium text-tm md:mt-2.5 md:max-w-[60ch] md:text-base md:leading-[1.65]">
                    {member.bio}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[12.5px] font-semibold md:mt-3">
                  {member.ressorts.length === 0 ? null : (
                    <span className="text-tm">{member.ressorts.join(" · ")}</span>
                  )}
                  <a
                    href={`mailto:${member.email}`}
                    className="inline-flex min-h-11 items-center text-ac md:min-h-0"
                  >
                    {member.email}
                  </a>
                  <a
                    href={archiveHref({ author: toSlug(member.name) })}
                    className="inline-flex min-h-11 items-center text-tm md:min-h-0"
                  >
                    Alle Beiträge →
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        {invitation === undefined ? null : (
          <section className="mt-6 rounded-[14px] border border-bd p-5 md:mt-10 md:p-7">
            <h2 className="text-[11px] font-bold tracking-[0.14em] text-tm uppercase md:text-xs">
              <Inline node={invitation.heading} />
            </h2>
            <p className="mt-2.5 text-[15.5px] leading-[1.6] font-medium md:mt-3 md:max-w-[56ch] md:text-[17px] md:leading-[1.65]">
              <Inline node={invitation.text} />
            </p>
            <div className="mt-3.5 flex flex-wrap gap-2.5 md:mt-4">
              <a
                href="/kontakt"
                className="inline-flex min-h-11 items-center rounded-[10px] bg-ac px-[18px] py-[11px] text-[13.5px] font-bold text-s1 md:min-h-0"
              >
                Kontakt aufnehmen
              </a>
              <a
                href={`mailto:${editorialEmail}`}
                className="hidden rounded-[10px] border border-bd px-[18px] py-[11px] text-[13.5px] font-bold md:inline-block"
              >
                {editorialEmail}
              </a>
            </div>
          </section>
        )}

        {note.map((node, index) => (
          <p
            key={index}
            className="mt-5 border-t border-bd pt-4 text-[13px] leading-[1.65] font-medium text-tm md:mt-[26px] md:max-w-[60ch] md:pt-[18px]"
          >
            <Inline node={node} />
          </p>
        ))}
    </>
  );
}
