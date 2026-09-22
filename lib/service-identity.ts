/**
 * The name a monitor groups this instance under, which is why it carries the
 * studio and not just the paper: every deployed service is named
 * `<projekt>-levo-studio`, and a health answer that says only "voxaudax" falls
 * out of that grouping while still replying.
 */
export const SERVICE_NAME = "voxaudax-levo-studio";

export const nowAsIso8601 = () => new Date().toISOString();
