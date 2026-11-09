/** Lottie JSON smaller than this stays inline on the board. Larger files go to the media store. */
export const LOTTIE_INLINE_MAX_BYTES = 100 * 1024;

export function isLottieJson(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as { v?: unknown; layers?: unknown };
  return Array.isArray(record.layers) && (typeof record.v === 'string' || typeof record.v === 'number');
}

/** Direct animation files. LottieFiles page links are not playable until they point at a file. */
export function parseLottieUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  const path = url.pathname.toLowerCase();
  if (path.endsWith('.json') || path.endsWith('.lottie')) return url.toString();
  return null;
}

export function looksLikeLottiePage(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return false;
  }
  const host = url.hostname.replace(/^www\./, '');
  return host === 'lottiefiles.com' || host.endsWith('.lottiefiles.com') || host === 'lottie.host';
}
