import Link from "next/link";

import { AcceptInvitationForm } from "@/app/admin/einladung/[token]/accept-form";
import { AuthPanel } from "@/components/admin/auth-panel";
import { openInvitation } from "@/lib/editorial/invitations";
import { roleLabel } from "@/lib/roles";

export const metadata = { title: "Einladung annehmen · Vox Audax Redaktion" };

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
    <AuthPanel>
      {invitation === null ? (
        <>
          <h1 className="mt-[22px] text-[26px] leading-[1.06] font-extrabold tracking-[-0.035em] md:text-[30px]">
            Dieser Link führt nicht mehr weiter
          </h1>
          <p className="mt-2.5 text-[15px] leading-relaxed font-medium text-tm">
            Einladungen gelten 24 Stunden oder 7 Tage und lassen sich nur einmal verwenden.
            Bitte die Chefredaktion um eine neue.
          </p>
          <Link
            href="/admin"
            className="mt-4 text-[13px] font-semibold text-ac no-underline"
          >
            Zur Anmeldung
          </Link>
        </>
      ) : (
        <>
          <h1 className="mt-[22px] text-[26px] leading-[1.06] font-extrabold tracking-[-0.035em] md:text-[30px]">
            Willkommen, {invitation.name.split(" ")[0]}
          </h1>
          <p className="mt-2.5 text-[15px] leading-relaxed font-medium text-tm">
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
    </AuthPanel>
  );
}
