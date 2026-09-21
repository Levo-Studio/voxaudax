/**
 * A token bucket per key, held in this process and nowhere else. The public
 * site runs as a single container, and a limiter that needed a shared store
 * would be an outage the contact form does not otherwise have. What it is here
 * to stop is one address using the form as a relay — not a distributed flood,
 * which belongs to the reverse proxy.
 */
type Bucket = { tokens: number; refilledAt: number };

export type Allowance =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export type Limit = {
  /** How many in a row before the sender has to wait. */
  capacity: number;
  /** How long one of those comes back. */
  refillMs: number;
};

export const rateLimiter = ({ capacity, refillMs }: Limit) => {
  const buckets = new Map<string, Bucket>();
  const fullAgainAfter = capacity * refillMs;

  /** A bucket that has refilled completely is the same as no bucket at all,
   *  and keeping it would let the map grow with every address ever seen. */
  const forgetTheSettled = (now: number) => {
    for (const [key, bucket] of buckets) {
      if (now - bucket.refilledAt >= fullAgainAfter) buckets.delete(key);
    }
  };

  return (key: string): Allowance => {
    const now = Date.now();
    forgetTheSettled(now);

    const bucket = buckets.get(key) ?? { tokens: capacity, refilledAt: now };
    const gained = Math.floor((now - bucket.refilledAt) / refillMs);
    const tokens = Math.min(capacity, bucket.tokens + gained);
    const refilledAt = bucket.refilledAt + gained * refillMs;

    if (tokens === 0) {
      buckets.set(key, { tokens, refilledAt });
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((refilledAt + refillMs - now) / 1000),
      };
    }

    buckets.set(key, { tokens: tokens - 1, refilledAt });
    return { allowed: true };
  };
};
