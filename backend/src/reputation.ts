import { sortAds } from "./ads.ts";
import type { Ad, Reputation } from "./types.ts";

export const EMPTY_REP: Reputation = { people: 0, state: 0, underworld: 0 };
export const STALE_AFTER = 3;

const LOW_FACTION = -2;
const FACTIONS = ["people", "state", "underworld"] as const;

export function adKind(message: string): "steal" | "kill" | "help" {
  const m = message || "";
  if (/\b(kill|assassinat|murder)\b/i.test(m)) return "kill";
  if (/\bsteal\b/i.test(m)) return "steal";
  return "help";
}

export function reputationChange(message: string): Reputation {
  const kind = adKind(message);
  if (kind === "steal") return { people: 1, state: -2, underworld: 0 };
  if (kind === "kill") return { people: -2, state: 0, underworld: 1 };
  return { people: 0.1, state: 0, underworld: 0 };
}

export function hurtsLowFaction(ad: Ad, rep: Reputation) {
  const change = reputationChange(ad.message);
  const current = rep || EMPTY_REP;

  for (const faction of FACTIONS) {
    const wouldHurt = change[faction] < 0;
    const alreadyLow = (current[faction] || 0) <= LOW_FACTION;
    if (wouldHurt && alreadyLow) return true;
  }
  return false;
}

export function suggestAd(ads: Ad[], rep: Reputation = EMPTY_REP): Ad | undefined {
  const safe = ads.filter((ad) => !hurtsLowFaction(ad, rep));
  return sortAds(safe.length ? safe : ads)[0];
}
