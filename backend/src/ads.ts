import type { Ad } from "./types.ts";

export const PROBABILITY_RANK: Record<string, number> = {
  "Piece of cake": 0,
  "Sure thing": 1,
  "Walk in the park": 2,
  "Quite likely": 3,
  "Hmmm....": 4,
  Gamble: 5,
  Risky: 6,
  "Playing with fire": 7,
  "Rather detrimental": 8,
  "Suicide mission": 9,
  Impossible: 10,
};

export function sortAds(ads: Ad[]) {
  return [...ads].sort((a, b) => {
    const ra = PROBABILITY_RANK[a.probability] ?? 99;
    const rb = PROBABILITY_RANK[b.probability] ?? 99;
    if (ra !== rb) return ra - rb;
    return b.reward - a.reward;
  });
}
