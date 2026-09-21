import type { Metadata } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { environment } from "@/lib/env";
import { formatNumber, machineDate, relativeDays, shortDate } from "@/lib/format";
import { memeGallery, publishedMemeSummary } from "@/lib/queries";
import { imageHref } from "@/lib/routes";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Memes",
  description: "Memes aus dem Schulalltag, gesammelt von der Redaktion.",
};

/** 10a fills four columns; a page of 48 fills them twelve rows deep. */
const PAGE_SIZE = 48;

/**
 * The gallery writes its own cursor into the "Ältere Memes" link, but the
 * address bar takes whatever is typed into it. The cursor names a meme, so
 * anything that is not the shape of an id opens the gallery at the top — there
 * is no value here that the database can be asked to read and refuse.
 */
const MEME_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const after = (value: string | string[] | undefined) => {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw !== undefined && MEME_ID.test(raw) ? raw : undefined;
};

export default async function MemesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parameters = await searchParams;
  const [{ memes, hasOlder }, { total, newest }] = await Promise.all([
    memeGallery(PAGE_SIZE, after(parameters.vor)),
    publishedMemeSummary(),
  ]);

  const editorialEmail = environment().MAIL_TO_EDITORIAL;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader current="memes" />

      <main className="flex-1 px-[18px] pt-[22px] pb-7 md:px-10 md:pt-10 md:pb-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-[30px] leading-[1.02] font-extrabold tracking-[-0.04em] md:text-[46px] md:leading-none">
              Memes
            </h1>
            <p className="mt-2 text-[15.5px] leading-[1.6] font-medium text-tm md:mt-2.5 md:max-w-[52ch] md:text-[17px]">
              Memes aus dem Schulalltag. Gesammelt und ausgewählt von der
              Redaktion.
            </p>
          </div>
          <span className="text-[12.5px] font-semibold text-tm">
            {formatNumber(total)} {total === 1 ? "Beitrag" : "Beiträge"}
            {newest === null ? null : ` · zuletzt ${relativeDays(newest)}`}
          </span>
        </div>

        {memes.length === 0 ? (
          <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.7] font-medium text-tm md:mt-8">
            Hier ist noch nichts. Die Redaktion hat bisher kein Meme
            veröffentlicht — sobald das erste freigegeben ist, steht es hier.
          </p>
        ) : (
          <div className="mt-5 columns-2 gap-3 md:mt-[30px] md:columns-4 md:gap-[18px]">
            {memes.map((meme) => (
              <figure key={meme.id} className="mb-3 break-inside-avoid md:mb-[18px]">
                {/* Not next/image: the bytes come from this application's own
                    route, and an optimiser in front of it would only add a
                    second copy of a picture that is already the right size. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageHref(meme.imageId)}
                  alt={meme.alt ?? meme.caption ?? "Meme ohne Beschreibung"}
                  width={meme.width}
                  height={meme.height}
                  loading="lazy"
                  decoding="async"
                  className="block w-full rounded-xl border border-bd bg-s2"
                />
                <figcaption className="mt-2 text-[11.5px] font-semibold text-tm">
                  {meme.caption === null ? null : (
                    <span className="mr-1.5 text-tx">{meme.caption}</span>
                  )}
                  <time dateTime={machineDate(meme.createdAt)}>
                    {shortDate(meme.createdAt)}
                  </time>
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-4">
          {hasOlder && memes.length > 0 ? (
            <a
              href={`/memes?vor=${memes[memes.length - 1].id}`}
              className="inline-flex min-h-11 items-center rounded-[10px] border border-bd px-[18px] font-control text-[13.5px] font-bold md:min-h-0 md:py-[11px]"
            >
              Ältere Memes
            </a>
          ) : null}
          <p className="text-[13px] leading-[1.6] font-medium text-tm">
            Eigenes Meme? Schick es an{" "}
            <a href={`mailto:${editorialEmail}`} className="font-bold text-ac">
              {editorialEmail}
            </a>{" "}
            — veröffentlicht wird nur, was niemanden bloßstellt.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
