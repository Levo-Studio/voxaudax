/**
 * A byline that names somebody who has left. The article keeps their name —
 * the work is theirs and stays attributed — and this says, quietly, that they
 * are no longer on the masthead, so a reader does not go looking for them on
 * the editorial page.
 *
 * Set in the interface's smallest type rather than in a colour of its own: it
 * is a footnote to the name, not a warning about it.
 */
export function FormerTag() {
  return (
    <span className="ml-1.5 inline-block rounded-full border border-bd px-[7px] py-px align-[1px] text-[9.5px] font-bold tracking-[0.06em] text-tm uppercase">
      Ehemalig
    </span>
  );
}
