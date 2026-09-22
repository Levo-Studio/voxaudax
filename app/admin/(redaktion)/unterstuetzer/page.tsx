import { DeleteSponsor } from "@/app/admin/(redaktion)/unterstuetzer/delete-sponsor";
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

/**
 * What the reader of this page actually wants to know: is this one on the
 * website right now, and if not, why not.
 *
 * The switch beside it answers only one of the four conditions. With all four
 * switches on and three sponsors on the home page, the row has to say which
 * one it is — otherwise the page looks as if it were lying.
 */
const onTheSite = (sponsor: {
  readonly active: boolean;
  readonly status: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
}) => {
  if (sponsor.status === "review") return { live: false, why: "wartet auf Freigabe" };
  if (sponsor.status === "abgelehnt") return { live: false, why: "abgelehnt" };
  if (!sponsor.active) return { live: false, why: "ausgeblendet" };
  if (sponsor.endsAt <= new Date()) return { live: false, why: "Zeitraum abgelaufen" };
  if (sponsor.startsAt > new Date()) return { live: false, why: "Zeitraum beginnt später" };
  return { live: true, why: "auf der Startseite" };
};

const remaining = (endsAt: Date) => {
  const days = Math.round((endsAt.getTime() - Date.now()) / 86400000);
  if (days <= 0) return "abgelaufen";
  if (days < 31) return `noch ${days} Tage`;
  return `noch ${Math.round(days / 30)} Monate`;
};

// Three columns since "Art" went: name, runtime, and the two controls. The
// last one is wide enough for "Löschen" beside the switch without wrapping.
const ROW = "grid grid-cols-[1fr_auto] gap-y-1 md:grid-cols-[1fr_150px_150px] md:gap-4";

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
                  </span>
                  {(() => {
                    const state = onTheSite(sponsor);
                    return (
                      <span
                        className={`mt-1 flex items-center gap-1.5 text-[11.5px] font-bold ${
                          state.live ? "text-ac" : "text-tm"
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`h-[7px] w-[7px] flex-none rounded-full ${
                            state.live ? "bg-ac" : "bg-bd"
                          }`}
                        />
                        {state.why}
                      </span>
                    );
                  })()}
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
              <span className="flex items-center justify-end gap-3.5 justify-self-end">
                {canManage ? (
                  <>
                    <DeleteSponsor sponsorId={sponsor.id} name={sponsor.name} />
                    <form action={toggleSponsorAction}>
                      <input type="hidden" name="sponsorId" value={sponsor.id} />
                      <ToggleSwitch name="active" checked={sponsor.active} label={`${sponsor.name} aktiv`} />
                    </form>
                  </>
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
