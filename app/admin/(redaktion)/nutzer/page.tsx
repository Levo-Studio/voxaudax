import Link from "next/link";

import { Avatar, COLUMN_HEADING_CLASS, PANEL_CLASS, PANEL_HEADING_CLASS } from "@/components/admin/controls";
import { InviteForm } from "@/app/admin/(redaktion)/nutzer/invite-form";
import { requireCapability } from "@/lib/authorize";
import { countMembers, listMembers, openInvitationFor } from "@/lib/editorial/members";
import { roleLabel } from "@/lib/roles";

export const metadata = { title: "Nutzer · Vox Audax Redaktion" };

const seenLabel = (at: Date | null) => {
  if (at === null) return "Noch nie angemeldet";
  const days = Math.floor((Date.now() - at.getTime()) / 86400000);
  if (days === 0) return "Zuletzt heute";
  if (days === 1) return "Zuletzt gestern";
  return `Zuletzt vor ${days} Tagen`;
};

const ROW = "grid grid-cols-1 gap-2 md:grid-cols-[1fr_128px_150px_170px] md:gap-4";

export default async function UsersPage() {
  const admin = await requireCapability("manageUsers");

  const [members, counts] = await Promise.all([listMembers(), countMembers()]);

  const rows = await Promise.all(
    members.map(async (member) => ({
      ...member,
      invitation: member.status === "eingeladen" ? await openInvitationFor(member.email) : null,
    })),
  );

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_330px]">
      <div className={PANEL_CLASS}>
        <div className="flex flex-wrap items-baseline gap-3 border-b border-bd px-4 py-[18px] md:px-[22px]">
          <h1 className="m-0 text-xl font-extrabold tracking-[-0.03em]">Nutzer</h1>
          <span className="text-[12.5px] font-semibold text-tm">
            {counts.admin} Admin · {counts.redakteur} Redakteur · {counts.autor} Autor ·{" "}
            {counts.invited} eingeladen
          </span>
        </div>

        <div className={`${ROW} hidden border-b border-bd px-[22px] py-[11px] md:grid`}>
          <span className={COLUMN_HEADING_CLASS}>Person</span>
          <span className={COLUMN_HEADING_CLASS}>Rolle</span>
          <span className={COLUMN_HEADING_CLASS}>Status</span>
          <span className={`${COLUMN_HEADING_CLASS} text-right`}>Aktionen</span>
        </div>

        {rows.map((member) => {
          const invited = member.status === "eingeladen";
          const expired = invited && member.invitation === null;

          return (
            <div key={member.id} className={`${ROW} items-center border-b border-bd px-4 py-3.5 last:border-b-0 md:px-[22px]`}>
              <span className="flex items-center gap-[11px]">
                <Avatar initials={member.initials} size={34} tone={invited ? "outline" : "accent"} />
                <span>
                  <span className="block text-[14.5px] font-bold tracking-[-0.02em]">{member.name}</span>
                  <span className="block text-[11.5px] font-semibold text-tm">{member.email}</span>
                </span>
              </span>

              <span className="text-[13px] font-bold">{roleLabel(member.role, member.form)}</span>

              <span className={`flex items-center gap-2 text-[12.5px] font-semibold ${expired ? "text-ac2" : "text-tm"}`}>
                <span className={`h-[7px] w-[7px] flex-none rounded-full ${expired ? "bg-ac2" : invited ? "bg-ac" : "bg-bd"}`} />
                {expired ? "Abgelaufen" : invited ? "Eingeladen" : seenLabel(member.lastSeenAt)}
              </span>

              <span className="flex justify-start gap-3 md:justify-end">
                {member.id === admin.id ? (
                  <span className="text-[12.5px] font-semibold text-tm">Du selbst</span>
                ) : (
                  <>
                    <Link
                      href={`/admin/nutzer/${member.id}`}
                      className="text-[12.5px] font-bold text-tm no-underline transition-colors duration-200 ease-out hover:text-tx"
                    >
                      Bearbeiten
                    </Link>
                    {member.velveUserId === null ? null : (
                      <Link
                        href={`/admin/nutzer/${member.id}/passwort`}
                        className="text-[12.5px] font-bold text-ac no-underline"
                      >
                        Passwort
                      </Link>
                    )}
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>

      <aside className={PANEL_CLASS}>
        <div className={PANEL_HEADING_CLASS}>Person einladen</div>
        <InviteForm />
      </aside>
    </div>
  );
}
