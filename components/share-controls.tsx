"use client";

import { useState } from "react";

/**
 * The two controls 13a draws. Both act on the page the reader is already on,
 * so neither is a navigation and neither can be a link: they are buttons, they
 * take focus, and they say out loud what happened.
 *
 * "Teilen" hands the browser's own share sheet the teaser with the link on a
 * line of its own under it. The link goes inside the text rather than beside it
 * in `url`: Signal, WhatsApp and a good part of the other targets keep one of
 * the two fields and drop the other, so a separate `url` arrived as a teaser
 * with nothing to tap — and where both survive, the link came twice.
 *
 * A desktop browser usually offers no share sheet, so there the same message
 * goes to the clipboard instead.
 */
export function ShareControls({
  title,
  teaser,
}: {
  title: string;
  teaser: string;
}) {
  const [notice, setNotice] = useState("");

  const message = () => {
    const link = window.location.href;
    return teaser.trim().length === 0 ? link : `${teaser.trim()}\n\n${link}`;
  };

  const copy = async (text: string, done: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(done);
    } catch {
      setNotice("Der Link ließ sich nicht kopieren.");
    }
  };

  const copyLink = () => copy(window.location.href, "Link kopiert.");

  const share = async () => {
    if (typeof navigator.share !== "function") {
      await copy(message(), "Teaser und Link kopiert.");
      return;
    }

    try {
      await navigator.share({ title, text: message() });
      setNotice("");
    } catch {
      // A cancelled share sheet throws as well, and a cancellation is not an
      // error the reader needs to be told about.
      setNotice("");
    }
  };

  const pill =
    "min-h-11 cursor-pointer items-center rounded-full border border-bd px-3 py-[7px] font-control text-[12.5px] font-bold text-tm md:min-h-0 md:px-3.5 md:py-2";

  return (
    <span className="ml-auto flex items-center gap-2">
      <span aria-live="polite" className="sr-only">
        {notice}
      </span>
      <button type="button" onClick={share} className={`inline-flex ${pill}`}>
        Teilen
      </button>
      {/* 13b leaves the second control off the phone, where the share sheet
          already offers copying. */}
      <button
        type="button"
        onClick={copyLink}
        className={`hidden md:inline-flex ${pill}`}
      >
        Link kopieren
      </button>
    </span>
  );
}
