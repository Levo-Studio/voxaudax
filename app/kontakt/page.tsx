import type { Metadata } from "next";

import { Avatar, toneForPosition } from "@/components/avatar";
import { ContactForm } from "@/components/contact-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { editorialAddress } from "@/lib/env";
import { alternates } from "@/lib/metadata";
import { editorialMembers, orNoneAtBuildTime } from "@/lib/queries";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Themenvorschlag, Korrektur, Leserbrief oder Interesse an der Redaktion.",
  alternates: alternates("/kontakt"),
};

export default async function ContactPage() {
  const editorialEmail = editorialAddress();
  const members = await orNoneAtBuildTime(editorialMembers(), []);
  const editorsInChief = members.filter((member) => member.role === "admin");

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader current="kontakt" />

      <main className="grid flex-1 gap-px md:grid-cols-[1.25fr_1fr] md:bg-bd">
        <section className="bg-s1 px-[18px] pt-5 pb-6 md:p-10">
          <h1 className="text-[32px] leading-[1.02] font-extrabold tracking-[-0.04em] md:text-[46px] md:leading-none">
            Schreib uns
          </h1>
          <p className="mt-2 text-[15.5px] leading-[1.6] font-medium text-tm md:mt-3 md:max-w-[52ch] md:text-[17px] md:leading-[1.62]">
            Themenvorschlag, Korrektur, Leserbrief oder Interesse an der
            Redaktion: Die Nachricht landet direkt im Postfach der
            Chefredaktion.
          </p>

          <ContactForm editorialEmail={editorialEmail} />
        </section>

        <aside className="flex flex-col gap-6 bg-s1 px-[18px] pt-5 pb-6 md:gap-[26px] md:p-10">
          <div>
            <div className="text-[11px] font-bold tracking-[0.12em] text-tm uppercase">
              Direkt
            </div>
            <div className="mt-2 flex flex-col gap-1.5">
              <a
                href={`mailto:${editorialEmail}`}
                className="inline-flex min-h-11 items-center text-[15px] font-semibold text-ac md:min-h-0"
              >
                {editorialEmail}
              </a>
              <span className="text-[13px] font-medium text-tm">
                Antwort meist innerhalb einer Woche
              </span>
            </div>
          </div>

          {editorsInChief.length === 0 ? null : (
            <div>
              <div className="text-[11px] font-bold tracking-[0.12em] text-tm uppercase">
                Chefredaktion
              </div>
              <div className="mt-2.5 flex flex-col gap-2.5">
                {editorsInChief.map((member, position) => (
                  <a
                    key={member.email}
                    href={`mailto:${member.email}`}
                    className="flex min-h-11 items-center gap-2.5 text-[14.5px] font-semibold md:min-h-0"
                  >
                    <Avatar
                      initials={member.initials}
                      size="aside"
                      tone={toneForPosition(position)}
                    />
                    {member.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* No tracking on this page and none anywhere else, which is worth
              saying where someone is about to type their name. */}
          <p className="text-[13px] leading-[1.6] font-medium text-tm">
            Diese Seite lädt nichts von fremden Servern und setzt keine Cookies.
            Was im Formular steht, geht an die Redaktion und sonst nirgendwohin.
          </p>
        </aside>
      </main>

      <SiteFooter />
    </div>
  );
}
