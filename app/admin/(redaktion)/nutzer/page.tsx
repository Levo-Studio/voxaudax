import { Avatar, COLUMN_HEADING_CLASS, PANEL_CLASS, PANEL_HEADING_CLASS } from "@/components/admin/controls";
import { MemberRow } from "@/components/admin/member-row";
import { InviteForm } from "@/app/admin/(redaktion)/nutzer/invite-form";
import { requireCapability } from "@/lib/authorize";
import { countMembers, listMembers } from "@/lib/editorial/members";
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

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_330px]">
      <div className={PANEL_CLASS}>
        <div className="flex flex-wrap items-baseline gap-3 border-b border-bd px-4 py-[18px] md:px-[22px]">
          <h1 className="m-0 text-xl font-extrabold tracking-[-0.03em]">Nutzer</h1>
          <span className="text-[12.5px] font-semibold text-tm">
            {counts.admin} Redaktionsleitung · {counts.redakteur} Redakteur ·{" "}
            {counts.autor} Autor · {counts.invited} eingeladen
            {counts.former === 0 ? null : ` · ${counts.former} ehemalig`}
          </span>
        </div>

        <div className={`${ROW} hidden border-b border-bd px-[22px] py-[11px] md:grid`}>
          <span className={COLUMN_HEADING_CLASS}>Person</span>
          <span className={COLUMN_HEADING_CLASS}>Rolle</span>
          <span className={COLUMN_HEADING_CLASS}>Status</span>
          <span className={`${COLUMN_HEADING_CLASS} text-right`}>Aktionen</span>
        </div>

        {members.map((member) => {
          const invited = member.status === "eingeladen";
          const expired = invited && !member.hasOpenInvitation;
          const former = member.status === "ehemalig";

          const cells = (
            <>
              <span className="flex items-center gap-[11px]">
                <Avatar initials={member.initials} size={34} tone={invited || former ? "outline" : "accent"} />
                <span>
                  <span className="block text-[14.5px] font-bold tracking-[-0.02em]">{member.name}</span>
                  <span className="block text-[11.5px] font-semibold text-tm">{member.email}</span>
                </span>
              </span>

              <span className={`text-[13px] font-bold ${former ? "text-tm" : ""}`}>
                {former ? "—" : roleLabel(member.role, member.form)}
              </span>

              <span className={`flex items-center gap-2 text-[12.5px] font-semibold ${expired ? "text-ac2" : "text-tm"}`}>
                <span className={`h-[7px] w-[7px] flex-none rounded-full ${expired ? "bg-ac2" : invited ? "bg-ac" : "bg-bd"}`} />
                {former
                  ? "Ehemalig"
                  : expired
                    ? "Abgelaufen"
                    : invited
                      ? "Eingeladen"
                      : seenLabel(member.lastSeenAt)}
              </span>
            </>
          );

          // Two rows carry no controls. The admin's own, because the two it
          // would offer are the two they must not use on themselves; and
          // somebody who has left, who has no role to change and no account to
          // reset — they are on the list only so it is visible whose byline is
          // still out there.
          if (member.id === admin.id || former) {
            return (
              <div key={member.id} className={`${ROW} items-center border-b border-bd px-4 py-3.5 last:border-b-0 md:px-[22px]`}>
                {cells}
                <span className="text-[12.5px] font-semibold text-tm md:text-right">
                  {former ? "Artikel bleiben" : "Du selbst"}
                </span>
              </div>
            );
          }

          return (
            <MemberRow
              key={member.id}
              member={{
                id: member.id,
                name: member.name,
                email: member.email,
                initials: member.initials,
                role: member.role,
                form: member.form,
                velveUserId: member.velveUserId,
              }}
              rowClassName={`${ROW} items-center px-4 py-3.5 md:px-[22px]`}
            >
              {cells}
            </MemberRow>
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
