"use server";

import { revalidatePath } from "next/cache";

import { refreshPublic } from "@/lib/refresh";

import { requireCapability } from "@/lib/authorize";
import {
  createSponsor,
  deleteSponsor,
  isRuntime,
  setSponsorActive,
  setSponsorLogo,
  updateSponsor,
  type SponsorInput,
} from "@/lib/editorial/sponsors";
import { readDimensions } from "@/lib/image-dimensions";
import { safeHref } from "@/lib/links";
import {
  LOGO_IMAGE_TYPES,
  MAXIMUM_UPLOAD_BYTES,
  removeObject,
  storeObject,
} from "@/lib/storage";

export type SponsorFormState = { readonly problem: string | null; readonly saved: boolean };

/**
 * Screen 11c writes the link the way the design shows it — "osiander.de",
 * without a scheme. A browser reads that as a path, so the tile on the front
 * page would link into this site and land on its 404 page; the scheme is
 * supplied here rather than demanded of the editor.
 *
 * `safeHref` first, for the same reason the body's links go through it: it
 * reads the address the way a browser does before deciding. It also passes
 * `mailto:` and `#`, which a sponsor tile is not for, so the protocol is asked
 * about afterwards.
 */
const webAddress = (typed: string) => {
  const address = safeHref(
    /^[a-z][a-z0-9+.-]*:/i.test(typed) ? typed : `https://${typed}`,
  );
  if (address === undefined) return null;

  try {
    const url = new URL(address);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
};

/**
 * Screen 11c: creating an entry and changing its runtime is `redakteur` and
 * `admin`. That is one capability, asked for once per action, so the switch in
 * the list and the form in the column cannot end up with different answers.
 */
const read = (form: FormData): SponsorInput | string => {
  const name = String(form.get("name") ?? "").trim();
  const initials = String(form.get("initials") ?? "").trim().toUpperCase();
  const url = String(form.get("url") ?? "").trim();
  const months = Number(form.get("months"));
  const startsAt = new Date(String(form.get("startsAt") ?? ""));

  if (name.length === 0) return "Ohne Namen lässt sich kein Eintrag anlegen.";
  if (initials.length === 0 || initials.length > 4) return "Das Kürzel hat ein bis vier Zeichen.";
  if (!isRuntime(months)) return "Wähle eine Laufzeit.";
  if (Number.isNaN(startsAt.getTime())) return "Das Startdatum ist kein Datum.";

  const link = url.length === 0 ? null : webAddress(url);
  if (url.length > 0 && link === null) return "Der Link ist keine Webadresse.";

  return { name, initials, url: link, months, startsAt };
};

export const saveSponsorAction = async (
  _state: SponsorFormState,
  form: FormData,
): Promise<SponsorFormState> => {
  const member = await requireCapability("manageSponsors");
  const input = read(form);
  if (typeof input === "string") return { problem: input, saved: false };

  const logo = form.get("logo");
  const alt = String(form.get("logoAlt") ?? "").trim();
  const hasLogo = logo instanceof File && logo.size > 0;

  /**
   * Every refusal belongs in front of the first write. The form only ever
   * creates, so a logo that was turned away after the row existed left an
   * entry behind without one — and the corrected second attempt wrote a second
   * entry beside it rather than filling the first one in.
   */
  if (hasLogo) {
    if (alt.length === 0) {
      return { problem: "Ein Logo ohne Alt-Text wird nicht gespeichert.", saved: false };
    }
    if (!(LOGO_IMAGE_TYPES as readonly string[]).includes(logo.type)) {
      return { problem: "Das ist kein Bildformat, das der Browser zeigt.", saved: false };
    }
    if (logo.size > MAXIMUM_UPLOAD_BYTES) {
      return { problem: "Das Logo ist größer als 8 MB.", saved: false };
    }
  }

  const sponsorId = String(form.get("sponsorId") ?? "");

  const identifier =
    sponsorId.length === 0
      ? (await createSponsor(member, input))[0]!.id
      : (await updateSponsor(member, sponsorId, input), sponsorId);

  /**
   * The bucket is the one dependency here that fails from outside the form, and
   * it fails after the row exists — the logo needs the row's id, so this is the
   * single refusal that cannot be moved in front of the first write. It is
   * therefore reported beside a saved entry rather than thrown: an exception
   * would have taken the whole column down over a picture, and a `saved: false`
   * would invite the second submission the note above exists to prevent.
   */
  let logoProblem: string | null = null;

  if (hasLogo) {
    const bytes = new Uint8Array(await logo.arrayBuffer());
    // An SVG carries no raster size; the tile is a fixed box either way, so a
    // vector logo is recorded at the box's own dimensions rather than refused.
    const size = readDimensions(bytes, logo.type) ?? { width: 40, height: 40 };

    let key: string | null = null;

    try {
      key = await storeObject({ prefix: "logos", bytes, mime: logo.type });
    } catch (cause) {
      console.error("error", "a sponsor logo could not be stored", { cause });
      logoProblem = "Der Eintrag steht, nur das Logo ließ sich nicht ablegen.";
    }

    if (key !== null) {
      const { replacedKey } = await setSponsorLogo({
        member,
        sponsorId: identifier,
        imageKey: key,
        mime: logo.type,
        width: size.width,
        height: size.height,
        alt,
      });

      // After the row, for the reason `deleteSponsorAction` gives: a failure in
      // the bucket must never leave a sponsor pointing at bytes that are gone.
      if (replacedKey !== null) await removeObject(replacedKey);
    }
  }

  revalidatePath("/admin/unterstuetzer");
  refreshPublic.sponsors();
  return { problem: logoProblem, saved: true };
};

export const toggleSponsorAction = async (form: FormData) => {
  await requireCapability("manageSponsors");
  await setSponsorActive(String(form.get("sponsorId") ?? ""), form.get("active") === "on");
  revalidatePath("/admin/unterstuetzer");
  refreshPublic.sponsors();
};

/**
 * Removing an entry for good. Not the same thing as the switch beside it: that
 * one takes a sponsor off the page and keeps the record of the agreement. This
 * is for the row that should never have existed.
 */
export const deleteSponsorAction = async (form: FormData) => {
  await requireCapability("manageSponsors");

  const { deleted, imageKey } = await deleteSponsor(String(form.get("sponsorId") ?? ""));
  if (!deleted) return;

  // After the row, so a failure in the bucket never leaves a sponsor pointing
  // at bytes that are gone.
  if (imageKey !== null) await removeObject(imageKey);

  revalidatePath("/admin/unterstuetzer");
  refreshPublic.sponsors();
};
