import { chatGroupLabel, type ChatGroupKind } from "@/lib/chat-groups";
import { safeHref } from "@/lib/links";
import { outward } from "@/lib/outward";

/**
 * One button per group the editorial team is reachable in — there is no fixed
 * meeting any more, so this is how somebody joins. The links were checked when
 * an admin saved them; `safeHref` reads them again here because this is where
 * they become an `href`.
 */
export function ChatGroupLinks({
  groups,
  className,
}: {
  groups: ReadonlyArray<{ readonly kind: ChatGroupKind; readonly url: string }>;
  className: string;
}) {
  return groups.map((group) => {
    const href = safeHref(group.url);
    if (href === undefined) return null;

    return (
      <a key={group.kind} href={href} {...outward(href)} className={className}>
        {chatGroupLabel(group.kind)}
      </a>
    );
  });
}
