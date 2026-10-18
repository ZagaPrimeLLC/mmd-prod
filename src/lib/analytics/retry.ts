/** The longest the tracker will wait before its one retry, whatever the server asks. */
export const MAX_RETRY_DELAY = 5 * 60_000;

/** null means permanent failure; milliseconds means a bounded, single retry. */
export function analyticsRetryDelay(status: number, retryAfter: string | null, configurationError = false, now = Date.now()): number | null {
  if (configurationError || !(status === 408 || status === 429 || status >= 500)) return null;
  if (retryAfter) {
    const seconds = Number(retryAfter);
    const delay = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(retryAfter) - now;
    if (Number.isFinite(delay)) return Math.min(MAX_RETRY_DELAY, Math.max(0, delay));
  }
  return 5_000;
}
