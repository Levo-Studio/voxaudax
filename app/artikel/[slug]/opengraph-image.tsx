import { ImageResponse } from "next/og";

import { coverColorById, resolveCoverColor } from "@/lib/cover";
import { articleBySlug } from "@/lib/queries";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Titelbild des Artikels";

/**
 * The cover the article wears, at the proportions a link preview uses. It is
 * drawn here rather than photographed from the page so that the word, the
 * colour and the headline are the ones stored with the article — the same
 * three things a reader sees at the top of it.
 */
/** What a link to an article that is gone falls back to. */
const HOUSE = coverColorById("violett");

export default async function ArticleOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await articleBySlug(slug);

  if (article === undefined) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: HOUSE.value,
            color: HOUSE.text,
            fontSize: 72,
            fontWeight: 800,
          }}
        >
          VOX AUDAX
        </div>
      ),
      size,
    );
  }

  const color = resolveCoverColor(article.title, article.cover.colorId);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: color.value,
          color: color.text,
          padding: 64,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            opacity: 0.85,
          }}
        >
          {article.categoryName}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 120, fontWeight: 800, lineHeight: 1 }}>
            {article.cover.word}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 40,
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            {article.title}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 24, fontWeight: 600, opacity: 0.85 }}>
          Vox Audax · {article.authorName}
        </div>
      </div>
    ),
    size,
  );
}
