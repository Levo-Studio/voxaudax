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
import {
  LOGO_IMAGE_TYPES,
  MAXIMUM_UPLOAD_BYTES,
  removeObject,
  storeObject,
} from "@/lib/storage";

export type SponsorFormState = { readonly problem: string | null; readonly saved: boolean };

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

  return { name, initials, url: url.length === 0 ? null : url, months, startsAt };
};

export const saveSponsorAction = async (
  _state: SponsorFormState,
  form: FormData,
): Promise<SponsorFormState> => {
  const member = await requireCapability("manageSponsors");
  const input = read(form);
  if (typeof input === "string") return { problem: input, saved: false };

  const sponsorId = String(form.get("sponsorId") ?? "");

  const identifier =
    sponsorId.length === 0
      ? (await createSponsor(member, input))[0]!.id
      : (await updateSponsor(sponsorId, input), sponsorId);

  const logo = form.get("logo");
  const alt = String(form.get("logoAlt") ?? "").trim();

  if (logo instanceof File && logo.size > 0) {
    if (alt.length === 0) {
      return { problem: "Ein Logo ohne Alt-Text wird nicht gespeichert.", saved: false };
    }
    if (!(LOGO_IMAGE_TYPES as readonly string[]).includes(logo.type)) {
      return { problem: "Erlaubt sind SVG und PNG.", saved: false };
    }
    if (logo.size > MAXIMUM_UPLOAD_BYTES) {
      return { problem: "Das Logo ist größer als 8 MB.", saved: false };
    }

    const bytes = new Uint8Array(await logo.arrayBuffer());
    // An SVG carries no raster size; the tile is a fixed box either way, so a
    // vector logo is recorded at the box's own dimensions rather than refused.
    const size = readDimensions(bytes, logo.type) ?? { width: 40, height: 40 };
    const key = await storeObject({ prefix: "logos", bytes, mime: logo.type });

    await setSponsorLogo({
      member,
      sponsorId: identifier,
      imageKey: key,
      mime: logo.type,
      width: size.width,
      height: size.height,
      alt,
    });
  }

  revalidatePath("/admin/unterstuetzer");
  refreshPublic.sponsors();
  return { problem: null, saved: true };
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
