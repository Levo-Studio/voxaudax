/**
 * Who the rate limiter counts.
 *
 * `lib/session` used to hand `X-Forwarded-For` to the library exactly as it
 * arrived. Two things were wrong with that. The header is a **list** —
 * `client, proxy1, proxy2` — so what was counted, stored in the session record
 * and shown on the account page was often several addresses in one string. And
 * it was believed unconditionally: anybody could write one and get a bucket of
 * their own for every request, which is the flood guard switched off by the
 * caller it is meant to guard against.
 *
 * The rule here is the library's own (`resolveClientAddress`, S-RATE-3): where
 * a trusted proxy is in front, the caller is the **rightmost** claimed address
 * that is not itself a trusted proxy — the last hop nobody trusted vouched for.
 * Taking the leftmost would let any client prepend an address and pick its own
 * bucket.
 *
 * **What this cannot check, and the deployment has to.** The library verifies
 * that the request actually *came* from a trusted proxy by looking at the
 * transport peer. A Next server action never sees one: `headers()` is all there
 * is. So with `TRUSTED_PROXIES` set, this believes the header — which is right
 * exactly as long as the container is reachable only through the proxy. If it
 * is ever published directly as well, the header can be forged and the flood
 * guard is back to where it was.
 *
 * With the list empty nothing is believed and every caller shares one bucket,
 * which is the library's own default and the safe way to be wrong.
 */

const OCTETS = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/** An IPv4 address as a number, or null for anything that is not one. */
const asNumber = (address: string): number | null => {
  const found = OCTETS.exec(address.trim());
  if (found === null) return null;

  let packed = 0;
  for (let part = 1; part <= 4; part += 1) {
    const octet = Number(found[part]);
    if (octet > 255) return null;
    packed = packed * 256 + octet;
  }
  return packed;
};

/**
 * Whether one address falls inside one entry of the list. A range covers what
 * its prefix covers; anything else has to match exactly, which is how an IPv6
 * proxy can still be named even though its ranges are not understood here.
 *
 * An entry that does not parse matches nothing, so a mistyped list ends in
 * trusting no header rather than in trusting the wrong one.
 */
const covers = (entry: string, address: string) => {
  const [range, bits] = entry.trim().split("/");
  if (range === undefined || range.length === 0) return false;
  if (bits === undefined) return range === address.trim();

  // `Number("")` is 0, not NaN, so `10.0.0.0/` would otherwise read as /0 and
  // cover the entire internet — a typo that trusts every header there is.
  if (bits.trim().length === 0) return false;

  const prefix = Number(bits);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;

  const base = asNumber(range);
  const candidate = asNumber(address);
  if (base === null || candidate === null) return false;

  // `>>> 0` because a 32-bit shift in JavaScript is signed, and /0 shifts by 32
  // — which is a no-op, not a zero.
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (base & mask) >>> 0 === ((candidate & mask) >>> 0);
};

export const parseTrustedProxies = (configured: string): readonly string[] =>
  configured
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

export const clientAddress = (
  forwardedFor: string | null,
  trustedProxies: readonly string[],
): string | null => {
  if (trustedProxies.length === 0 || forwardedFor === null) return null;

  const claimed = forwardedFor
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  for (let hop = claimed.length - 1; hop >= 0; hop -= 1) {
    const address = claimed[hop]!;
    if (!trustedProxies.some((proxy) => covers(proxy, address))) return address;
  }

  // Every hop was a proxy we trust, so nobody outside them ever spoke.
  return null;
};
