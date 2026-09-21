/**
 * The initials disc. Nobody in the seeded editorial team has a photograph, and
 * the template draws none: every screen sets two letters on one of three
 * grounds, cycling through the list it is drawn from.
 */

export type AvatarTone = "ac" | "ac2" | "tx";

/**
 * White on --ac measures 2.38:1 once the dark theme lightens the accent, so
 * the ink is --s1 in all three tones: it is the page's own ground and
 * therefore the opposite of every accent in either theme.
 */
const TONES: Record<AvatarTone, string> = {
  ac: "bg-ac text-s1",
  ac2: "bg-ac2 text-s1",
  tx: "bg-tx text-s1",
};

const CYCLE: readonly AvatarTone[] = ["ac", "ac2", "tx"];

/** Position in the list decides the ground, exactly as 3a, 5b and 9a cycle it. */
export const toneForPosition = (position: number) =>
  CYCLE[position % CYCLE.length];

export type AvatarSize =
  | "chip"
  | "aside"
  | "byline"
  | "strip"
  | "box"
  | "member";

const SIZES: Record<AvatarSize, string> = {
  chip: "size-[26px] text-[10.5px]",
  aside: "size-[30px] text-[11px]",
  byline: "size-7 text-[11px] md:size-8 md:text-[12px]",
  strip: "size-[34px] text-[11.5px] md:size-11 md:text-[13.5px]",
  box: "size-[52px] text-base",
  member: "size-12 text-[15px] md:size-16 md:text-[19px]",
};

export function Avatar({
  initials,
  size,
  tone = "ac",
}: {
  initials: string;
  size: AvatarSize;
  tone?: AvatarTone;
}) {
  return (
    <span
      aria-hidden
      className={`grid flex-none place-items-center rounded-full font-bold tracking-[-0.02em] ${SIZES[size]} ${TONES[tone]}`}
    >
      {initials}
    </span>
  );
}
