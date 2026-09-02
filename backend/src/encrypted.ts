import type { Ad } from "./types.ts";

function rot13(str: string) {
  return str.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base)
  })
}

function fromBase64(str: string) {
  return atob(str);
}

const DECODERS = new Map<number, (str: string) => string>([
  [1, fromBase64],
  [2, rot13],
]);

export function decodeAd(ad: Ad): Ad | null {
  if (ad.encrypted === null) return ad;

  const decode = DECODERS.get(ad.encrypted);
  if (!decode) return null;

  try {
    return {
      ...ad,
      adId: decode(ad.adId),
      message: decode(ad.message),
      probability: decode(ad.probability),
      encrypted: null,
    };
  } catch {
    return null;
  }
}
