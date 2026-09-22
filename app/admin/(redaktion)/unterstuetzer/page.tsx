import { RejectionNote } from "@/components/admin/rejection-note";
import { COLUMN_HEADING_CLASS, PANEL_CLASS, PANEL_HEADING_CLASS } from "@/components/admin/controls";
import { ToggleSwitch } from "@/components/admin/toggle-switch";
import { toggleSponsorAction } from "@/app/admin/(redaktion)/unterstuetzer/actions";
import { SponsorForm } from "@/app/admin/(redaktion)/unterstuetzer/sponsor-form";
import { requireMember } from "@/lib/authorize";
import { countRunningSponsors, listSponsors } from "@/lib/editorial/sponsors";
import { may } from "@/lib/roles";

export const metadata = { title: "Unterstützer · Vox Audax Redaktion" };

const DATE = new Intl.DateTimeFormat("de-DE");

const remaining = (endsAt: Date) => {
  const days = Math.round((endsAt.getTime() - Date.now()) / 86400000);
  if (days <= 0) return "abgelaufen";
  if (days < 31) return `noch ${days} Tage`;
  return `noch ${Math.round(days / 30)} Monate`;
};

const ROW = "grid grid-cols-[1fr_auto] gap-y-1 md:grid-cols-[1fr_150px_128px_92px] md:gap-4";

export default async function SponsorsPage() {
  const member = await requireMember();
  const canManage = may(member.role, "manageSponsors");

  const [sponsors, counts] = await Promise.all([listSponsors(), countRunningSponsors()]);

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_330px]">
      <div className={PANEL_CLASS}>
        <div className="flex flex-wrap items-baseline gap-3 border-b border-bd px-4 py-[18px] md:px-[22px]">
          <h1 className="m-0 text-xl font-extrabold tracking-[-0.03em]">Unterstützer</h1>
          <span className="text-[12.5px] font-semibold text-tm">
            {counts.running} von {counts.total} aktiv
          </span>
        </div>

        <div className={`${ROW} hidden border-b border-bd px-[22px] py-[11px] md:grid`}>
          <span className={COLUMN_HEADING_CLASS}>Logo und Name</span>
          <span className={COLUMN_HEADING_CLASS}>Art</span>
          <span className={COLUMN_HEADING_CLASS}>Sichtbar bis</span>
          <span className={`${COLUMN_HEADING_CLASS} text-right`}>Aktiv</span>
        </div>

        {sponsors.length === 0 ? (
          <p className="px-4 py-8 text-[13.5px] font-medium text-tm md:px-[22px]">
            Noch kein Eintrag angelegt.
          </p>
        ) : (
          sponsors.map((sponsor) => (
            <div key={sponsor.id} className={`${ROW} items-center border-b border-bd px-4 py-3.5 last:border-b-0 md:px-[22px]`}>
              <span className="col-span-2 flex items-center gap-3 md:col-span-1">
                {sponsor.logoImageId === null ? (
                  <span className="grid h-10 w-10 flex-none place-items-center rounded-[9px] border border-bd bg-s2 text-xs font-extrabold text-tm">
                    {sponsor.initials}
                  </span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/bilder/${sponsor.logoImageId}`}
                    alt={sponsor.logoAlt ?? ""}
                    className="h-10 w-10 flex-none rounded-[9px] border border-bd bg-s2 object-contain"
                  />
                )}
                <span>
                  <span className="block text-[14.5px] font-bold tracking-[-0.02em]">{sponsor.name}</span>
                  <span className="block text-[11.5px] font-semibold text-tm">
                    {sponsor.url ?? "ohne Link"}
                    {sponsor.status === "review"
                      ? " · wartet auf Freigabe"
                      : sponsor.status === "abgelehnt"
                        ? " · abgelehnt"
                        : ""}
                  </span>
                  <RejectionNote reason={sponsor.rejectionReason} />
                </span>
              </span>
              <span className="text-[13px] font-semibold">
                {DATE.format(sponsor.endsAt)}
                {/* One colour for every runtime. "abgelaufen" already says it
                    has run out; painting it red as well made half the column
                    look like a fault when nothing is wrong. */}
                <span className="block text-[11px] font-semibold text-tm">
                  {remaining(sponsor.endsAt)}
                </span>
              </span>
              <span className="justify-self-end">
                {canManage ? (
                  <form action={toggleSponsorAction}>
                    <input type="hidden" name="sponsorId" value={sponsor.id} />
                    <ToggleSwitch name="active" checked={sponsor.active} label={`${sponsor.name} aktiv`} />
                  </form>
                ) : (
                  <span className="text-[12.5px] font-semibold text-tm">
                    {sponsor.active ? "aktiv" : "aus"}
                  </span>
                )}
              </span>
            </div>
          ))
        )}

        <p className="px-4 py-3.5 text-[12.5px] font-medium text-tm md:px-[22px]">
          Abgelaufene Einträge verschwinden automatisch von der Startseite und bleiben hier als
          Archiv stehen. Ist keiner aktiv, fällt die Section dort ersatzlos weg.
        </p>
      </div>

      {canManage ? (
        <aside className={PANEL_CLASS}>
          <div className={PANEL_HEADING_CLASS}>Neu anlegen</div>
          <SponsorForm today={new Date().toISOString().slice(0, 10)} />
        </aside>
      ) : null}
    </div>
  );
}
