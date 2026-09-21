import { ImageResponse } from "next/og";

import { coverColorById } from "@/lib/cover";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Vox Audax — Schülerzeitung des Uhland-Gymnasiums";

/** The paper's own cover: the same violet an article wearing it would get. */
const HOUSE = coverColorById("violett");

/** What a link to the paper itself looks like when someone shares it. */
export default function SiteOpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: HOUSE.value,
          color: HOUSE.text,
          padding: 64,
        }}
      >
        <div style={{ display: "flex", fontSize: 128, fontWeight: 800, letterSpacing: -4 }}>
          VOX AUDAX
        </div>
        <div style={{ display: "flex", marginTop: 20, fontSize: 34, fontWeight: 600, opacity: 0.85 }}>
          Schülerzeitung des Uhland-Gymnasiums
        </div>
      </div>
    ),
    size,
  );
}
