import { Ad, type RiskLevel } from './types';


export const PROBABILITY_RANK: Record<string, number> = {
  'Piece of cake': 0,
  'Sure thing': 1,
  'Walk in the park': 2,
  'Quite likely': 3,
  'Hmmm....': 4,
  Gamble: 5,
  Risky: 6,
  'Playing with fire': 7,
  'Rather detrimental': 8,
  'Suicide mission': 9,
  Impossible: 10,
}

function rot13(str: string) {
  return str.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  })
}

function fromBase64(str: string) {
  return atob(str);
}


const DECODERS = new Map<number, (value: string) => string>([
  [1, fromBase64],
  [2, rot13],
])

export function decodeAd(ad: Ad): Ad | null {
  if (!ad.encrypted) return ad

  const decode = DECODERS.get(Number(ad.encrypted))
  if (!decode) return null

  try {
    return {
      ...ad,
      adId: decode(ad.adId),
      message: decode(ad.message),
      probability: decode(ad.probability),
      encrypted: null,
    }
  } catch {
    return null
  }
}

export function riskLevel(probability: string): RiskLevel {
  const rank = PROBABILITY_RANK[probability]
  if (rank == null) return 'unknown'
  if (rank <= 2) return 'safe'
  if (rank <= 4) return 'okay'
  if (rank <= 6) return 'risky'
  if (rank <= 9) return 'deadly'
  return 'impossible'
}

export function isSketchy(message: string) {
  return /\b(steal|kill|assassinat|murder)\b/i.test(message || '')
}

export function sortAds(ads: Ad[]) {
  return [...ads].sort((a, b) => {
    const ra = PROBABILITY_RANK[a.probability] ?? 99
    const rb = PROBABILITY_RANK[b.probability] ?? 99
    if (ra !== rb) return ra - rb
    return Number(b.reward) - Number(a.reward)
  })
}

export function putSuggestedFirst(ads: Ad[], suggestedId: string | null) {
  if (!suggestedId) return ads
  const i = ads.findIndex((a) => a.adId === suggestedId)
  if (i <= 0) return ads
  return [ads[i], ...ads.slice(0, i), ...ads.slice(i + 1)]
}

export function rewardVsRisk(ad: Ad) {
  const rank = PROBABILITY_RANK[ad.probability]
  if (rank == null) return null
  return (Number(ad.reward) / (rank + 1)).toFixed(1)
}
