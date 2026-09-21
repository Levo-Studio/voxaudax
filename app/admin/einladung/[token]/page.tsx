import Link from "next/link";

import { AcceptInvitationForm } from "@/app/admin/einladung/[token]/accept-form";
import { openInvitation } from "@/lib/editorial/invitations";
import { roleLabel } from "@/lib/roles";

export const metadata = { title: "Einladung annehmen · Vox Audax Redaktion" };

const Brand = () => (
  <Link href="/admin" className="flex items-baseline gap-[9px] no-underline">
    <span className="text-[19px] font-extrabold tracking-[-0.04em] text-ac">VOX AUDAX</span>
    <span className="text-[11px] font-bold tracking-[0.14em] text-tm uppercase">Redaktion</span>
  </Link>
);

/**
 * Screen 8b — the page behind the link. The token is read here only to decide
 * what to greet the person with; whether it is still usable is decided again
 * when the password is submitted, in the same statement that spends it.
 */
export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await openInvitation(token);

  return (
    <main className="mx-auto max-w-[560px] px-4 py-10 md:px-10">
      <Brand />

      {invitation === null ? (
        <>
          <h1 className="mt-[22px] text-[26px] leading-[1.06] font-extrabold tracking-[-0.035em] md:text-[32px]">
            Dieser Link führt nicht mehr weiter
          </h1>
          <p className="mt-2.5 max-w-[46ch] text-[15.5px] leading-relaxed font-medium text-tm">
            Einladungen gelten 24 Stunden oder 7 Tage und lassen sich nur einmal verwenden.
            Bitte die Chefredaktion um eine neue.
          </p>
          <Link href="/admin" className="mt-4 inline-block text-[13px] font-semibold text-ac no-underline">
            Zur Anmeldung
          </Link>
        </>
      ) : (
        <>
          <h1 className="mt-[22px] text-[26px] leading-[1.06] font-extrabold tracking-[-0.035em] md:text-[32px]">
            Willkommen, {invitation.name.split(" ")[0]}
          </h1>
          <p className="mt-2.5 max-w-[46ch] text-[15.5px] leading-relaxed font-medium text-tm">
            {invitation.invitedByName} hat dich als {roleLabel(invitation.role, invitation.form)}{" "}
            eingeladen. Setz ein Passwort, danach kannst du dich jederzeit unter /admin anmelden.
          </p>
          <div className="mt-[18px] flex items-baseline gap-2.5 rounded-[10px] border border-bd px-3.5 py-[11px] text-[13px] font-semibold">
            <span className="text-tm">Konto</span>
            {invitation.email}
          </div>
          <AcceptInvitationForm token={token} />
        </>
      )}
    </main>
  );
}
