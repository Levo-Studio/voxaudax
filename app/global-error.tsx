"use client";

import { useEffect } from "react";

/**
 * The last boundary: it catches what fails in the root layout itself, and it
 * replaces that layout while it is shown. So there is no globals.css here, no
 * theme boot script and no font — none of it has loaded at that point — and the
 * page is therefore written with its own tags and its own few declarations
 * rather than with the tokens the rest of the application uses. It is the one
 * screen in this project that may not depend on anything.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("error", "the root layout could not be rendered", {
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="de">
      <body
        style={{
          colorScheme: "light dark",
          margin: 0,
          minHeight: "100dvh",
          padding: "clamp(18px, 6vw, 40px)",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          lineHeight: 1.6,
        }}
      >
        <main style={{ maxWidth: "48ch" }}>
          <h1 style={{ fontSize: "clamp(28px, 7vw, 44px)", letterSpacing: "-0.04em", margin: 0 }}>
            Da ist etwas schiefgegangen
          </h1>
          <p style={{ marginTop: "0.9rem", fontSize: "1.05rem" }}>
            Vox Audax ließ sich gerade nicht laden. Versuch es in einem Moment
            noch einmal.
          </p>
          <p style={{ marginTop: "1.4rem" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                minHeight: 44,
                cursor: "pointer",
                borderRadius: 10,
                border: "1px solid currentColor",
                background: "transparent",
                color: "inherit",
                font: "inherit",
                fontWeight: 700,
                padding: "0 18px",
              }}
            >
              Noch einmal versuchen
            </button>
          </p>
          {error.digest === undefined ? null : (
            <p style={{ marginTop: "1.4rem", fontSize: "0.85rem", opacity: 0.7 }}>
              Kennung für die Redaktion: {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
