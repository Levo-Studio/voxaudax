/**
 * The fourteen covers an article can wear. `text` is the ink that belongs on
 * `value` and is the only source for it — the --covtx token is white in both
 * themes, which on Signalgelb or Bernstein would fall far below AA.
 */
export const COVER_COLORS = [
  { id: "violett", name: "Violett", value: "#4b34e6", text: "#ffffff" },
  { id: "ultramarin", name: "Ultramarin", value: "#2c4bd8", text: "#ffffff" },
  { id: "azur", name: "Azur", value: "#0f6fd4", text: "#ffffff" },
  { id: "petrol", name: "Petrol", value: "#0d7f74", text: "#ffffff" },
  { id: "tanne", name: "Tanne", value: "#177a3c", text: "#ffffff" },
  { id: "oliv", name: "Oliv", value: "#6b8f12", text: "#16180a" },
  { id: "signalgelb", name: "Signalgelb", value: "#d8f24a", text: "#16180a" },
  { id: "bernstein", name: "Bernstein", value: "#f0a81c", text: "#1d1403" },
  { id: "rost", name: "Rost", value: "#c8410c", text: "#ffffff" },
  { id: "karmin", name: "Karmin", value: "#c62644", text: "#ffffff" },
  { id: "magenta", name: "Magenta", value: "#a3327f", text: "#ffffff" },
  { id: "kastanie", name: "Kastanie", value: "#6b4a2e", text: "#ffffff" },
  { id: "schiefer", name: "Schiefer", value: "#4a4f58", text: "#ffffff" },
  { id: "schwarz", name: "Schwarz", value: "#111110", text: "#f5f5ee" },
] as const;

export type CoverColor = (typeof COVER_COLORS)[number];

export type CoverColorId = CoverColor["id"];

const COVER_COLORS_BY_ID = Object.fromEntries(
  COVER_COLORS.map((color) => [color.id, color]),
) as Record<CoverColorId, CoverColor>;

export const isCoverColorId = (value: unknown): value is CoverColorId =>
  COVER_COLORS.some((color) => color.id === value);

export const coverColorById = (id: CoverColorId): CoverColor =>
  COVER_COLORS_BY_ID[id];

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/**
 * Keeps the modulo off FNV-1a's lowest bits, which it mixes least and which a
 * divisor of fourteen leans on hardest.
 */
const avalanche = (hash: number) => {
  let mixed = hash;
  mixed ^= mixed >>> 16;
  mixed = Math.imul(mixed, 0x85ebca6b);
  mixed ^= mixed >>> 13;
  mixed = Math.imul(mixed, 0xc2b2ae35);
  mixed ^= mixed >>> 16;
  return mixed >>> 0;
};

/**
 * FNV-1a over the title's UTF-16 code units. Nothing here consults the locale
 * or an object's key order, so the same title yields the same colour on every
 * machine and in every request.
 *
 * The title is normalised first because "Grüße" typed with a combining diaeresis
 * and "Grüße" typed with a precomposed ü read identically but hash apart.
 */
export const suggestCoverColorId = (title: string): CoverColorId => {
  const normalised = title.normalize("NFC");
  let hash = FNV_OFFSET_BASIS;
  for (let index = 0; index < normalised.length; index += 1) {
    hash ^= normalised.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return COVER_COLORS[avalanche(hash) % COVER_COLORS.length].id;
};

/**
 * An article stores a palette id or nothing at all; "nothing" means the
 * suggestion still stands, so the colour never has to be written on save.
 */
export const resolveCoverColor = (
  title: string,
  chosen?: CoverColorId | null,
): CoverColor => coverColorById(chosen ?? suggestCoverColorId(title));
