"use client";

import Link from "next/link";
import { useEffect } from "react";

import {
  PANEL_CLASS,
  PANEL_HEADING_CLASS,
  PRIMARY_BUTTON_CLASS,
  QUIET_BUTTON_CLASS,
} from "@/components/admin/controls";

/**
 * A boundary of its own for the back office, so a failing page is replaced
 * inside the shell: the navigation stays, and whoever was working keeps the way
 * to the other screens instead of landing on the framework's own page with no
 * header and no link back.
 *
 * It cannot give an editor their unsaved text back — a boundary replaces the
 * segment, the form is gone with it — which is why the editor catches its own
 * save rather than relying on this.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("error", "a back office page could not be rendered", {
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className={`${PANEL_CLASS} max-w-[560px]`}>
      <h1 className={PANEL_HEADING_CLASS}>Fehler</h1>
      <div className="px-[18px] py-4">
        <p className="text-[13.5px] font-semibold">
          Diese Seite ließ sich gerade nicht laden.
        </p>
        <p className="mt-1.5 text-xs font-medium text-tm">
          Oft ist es die Verbindung zur Datenbank und einen Moment später wieder
          gut. Bleibt es dabei, gib der Redaktionsleitung die Kennung unten weiter.
        </p>
        <div className="mt-3.5 flex flex-wrap gap-2">
          <button type="button" onClick={reset} className={PRIMARY_BUTTON_CLASS}>
            Noch einmal versuchen
          </button>
          <Link href="/admin/artikel" className={`${QUIET_BUTTON_CLASS} no-underline`}>
            Zur Artikelliste
          </Link>
        </div>
        {error.digest === undefined ? null : (
          <p className="mt-3 font-control text-xs font-medium text-tm">
            Kennung: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
