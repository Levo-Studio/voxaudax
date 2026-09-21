import { FilterPill, PANEL_CLASS, PANEL_HEADING_CLASS } from "@/components/admin/controls";
import { ToggleSwitch } from "@/components/admin/toggle-switch";
import { toggleMemeVisibilityAction } from "@/app/admin/(redaktion)/memes/actions";
import { MemeUploadForm } from "@/app/admin/(redaktion)/memes/upload-form";
import { requireMember } from "@/lib/authorize";
import { countMemes, isMemeFilter, listMemes, MEME_FILTERS } from "@/lib/editorial/memes";
import { may } from "@/lib/roles";

export const metadata = { title: "Memes · Vox Audax Redaktion" };

const DAY = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" });

export default async function MemesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const member = await requireMember();
  const parameters = await searchParams;
  const filter = isMemeFilter(parameters.filter) ? parameters.filter : "alle";

  const [memes, counts] = await Promise.all([listMemes(filter), countMemes()]);

  // The switch is drawn for the people whose switch it is. The action asks the
  // same question again before it writes, so this hides a control rather than
  // holding a permission.
  const mayDecide = may(member.role, "approveArticlesAndMemes");

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[1fr_330px]">
      <div className={PANEL_CLASS}>
        <div className="flex flex-wrap items-baseline gap-3 border-b border-bd px-4 py-[18px] md:px-[22px]">
          <h1 className="m-0 text-xl font-extrabold tracking-[-0.03em]">Memes</h1>
          <span className="text-[12.5px] font-semibold text-tm">
            {counts.online} online · {counts.hidden} ausgeblendet
          </span>
          <div className="ml-auto flex gap-1.5">
            {Object.entries(MEME_FILTERS).map(([key, label]) => (
              <FilterPill
                key={key}
                href={key === "alle" ? "/admin/memes" : { pathname: "/admin/memes", query: { filter: key } }}
                active={filter === key}
              >
                {label}
              </FilterPill>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 px-4 py-5 md:grid-cols-3 md:px-[22px]">
          {memes.length === 0 ? (
            <p className="col-span-full text-[13.5px] font-medium text-tm">
              Zu dieser Auswahl liegt kein Meme vor.
            </p>
          ) : (
            memes.map((meme) => {
              const online = meme.visible && meme.status === "published";
              return (
                <figure key={meme.id} className="m-0">
                  {/* The picture is dimmed while it is offline; the line under
                      it is not, because that line is what says so. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/bilder/${meme.imageId}`}
                    alt={meme.alt ?? ""}
                    width={meme.width}
                    height={meme.height}
                    className={`block w-full rounded-xl border border-bd bg-s2 ${online ? "" : "opacity-60"}`}
                  />
                  <figcaption className="mt-[9px] flex flex-wrap items-center gap-2.5 text-[11.5px] font-semibold text-tm">
                    <span>{DAY.format(meme.createdAt)}</span>
                    <span className="flex items-center gap-1.5">
                      <span className={`h-[7px] w-[7px] rounded-full ${online ? "bg-ac" : "bg-bd"}`} />
                      {meme.status === "review" ? "Wartet auf Freigabe" : online ? "Online" : "Ausgeblendet"}
                    </span>
                    {mayDecide ? (
                      <form action={toggleMemeVisibilityAction} className="ml-auto">
                        <input type="hidden" name="memeId" value={meme.id} />
                        <ToggleSwitch
                          name="visible"
                          checked={meme.visible}
                          label={`Sichtbarkeit von Meme vom ${DAY.format(meme.createdAt)}`}
                        />
                      </form>
                    ) : null}
                  </figcaption>
                  {meme.caption === null ? null : (
                    <p className="mt-1 text-xs font-medium text-tm">{meme.caption}</p>
                  )}
                </figure>
              );
            })
          )}
        </div>

        <p className="px-4 pb-5 text-[12.5px] font-medium text-tm md:px-[22px]">
          Bilder liegen im Objektspeicher, nicht im Repo, und werden von dieser Anwendung
          ausgeliefert — der Speicher-Host erreicht keinen Browser.
        </p>
      </div>

      <aside className={PANEL_CLASS}>
        <div className={PANEL_HEADING_CLASS}>Neues Meme</div>
        <MemeUploadForm />
      </aside>
    </div>
  );
}
