import { SOURCE_URL } from "@/lib/outward";
import { outward } from "@/lib/outward";

/**
 * Why the newspaper's own code is readable by anybody.
 *
 * Not in the template. It is here because the link in the footer says where the
 * source is and nothing about why, and "open source" on a school paper invites
 * exactly one question — whether that means the articles are public property
 * too. They are not, and the difference is worth one paragraph.
 *
 * The licence is not named from memory: MIT is what `LICENSE` in the repository
 * says, and if that ever changes this sentence is wrong, so it links to the
 * file rather than restating its terms.
 */
const LICENCE_URL = `${SOURCE_URL}/blob/main/LICENSE`;

export function OpenSource() {
  return (
    <section
      aria-labelledby="quelltext"
      className="border-t border-bd bg-s2 px-[18px] py-6 md:px-10 md:py-9"
    >
      <h2
        id="quelltext"
        className="text-[11px] font-bold tracking-[0.14em] text-tm uppercase md:text-xs"
      >
        Offener Quelltext
      </h2>

      <p className="mt-3 text-[16px] leading-[1.6] font-medium md:mt-3.5 md:max-w-[62ch] md:text-[17.5px] md:leading-[1.62]">
        Diese Seite ist offen: jede Zeile, aus der sie gebaut ist, steht öffentlich
        auf GitHub — nachzulesen, zu kopieren und für die eigene Schülerzeitung zu
        verwenden.
      </p>

      <p className="mt-2.5 text-[14px] leading-[1.6] font-medium text-tm md:max-w-[62ch] md:text-[15px]">
        Wir halten das für richtig, weil eine Zeitung erklären können sollte, wie
        sie funktioniert. Wer wissen will, wonach das Archiv sortiert, wer einen
        Artikel freigeben darf oder was mit einer Nachricht aus dem Kontaktformular
        passiert, muss es uns nicht glauben — es steht da. Und weil die nächste
        Redaktion in ein paar Jahren nicht wieder bei null anfangen soll.
      </p>

      <p className="mt-2.5 text-[14px] leading-[1.6] font-medium text-tm md:max-w-[62ch] md:text-[15px]">
        Offen ist der Quelltext, nicht die Zeitung. Artikel, Fotos und Memes
        gehören denen, die sie gemacht haben, und bleiben es.
      </p>

      <div className="mt-4 flex flex-wrap gap-2.5 md:mt-5">
        <a
          href={SOURCE_URL}
          {...outward(SOURCE_URL)}
          className="inline-flex min-h-11 items-center rounded-[9px] bg-ac px-[18px] text-[13.5px] font-bold text-s1 transition-opacity hover:opacity-85"
        >
          Quelltext ansehen
        </a>
        <a
          href={LICENCE_URL}
          {...outward(LICENCE_URL)}
          className="inline-flex min-h-11 items-center rounded-[9px] border border-bd px-[18px] text-[13.5px] font-bold text-tm transition-colors hover:text-tx"
        >
          MIT-Lizenz
        </a>
      </div>
    </section>
  );
}
