import { sortAds } from './ads';
import { Reputation, type Faction, Ad, type AdKind } from './types';

export const EMPTY_REP: Reputation = { people: 0, state: 0, underworld: 0 };
export const REP_STALE_AFTER = 3;

const LOW_FACTION = -2
const FACTIONS: Faction[] = ['people', 'state', 'underworld']

export function adKind(message: string): AdKind {
  const m = message || ''
  if (/\b(kill|assassinat|murder)\b/i.test(m)) return 'kill'
  if (/\bsteal\b/i.test(m)) return 'steal'
  return 'help'
}

export function reputationChange(message: string): Reputation {
  const kind = adKind(message)
  if (kind === 'steal') return { people: 1, state: -2, underworld: 0 }
  if (kind === 'kill') return { people: -2, state: 0, underworld: 1 }
  return { people: 0.1, state: 0, underworld: 0 }
}

export function formatRep(n: number | undefined) {
  const s = Number(n || 0).toFixed(1);
  return s.endsWith('.0') ? s.slice(0, -2) : s;
}

export function fromLive(live: Reputation): Reputation {
  return {
    people: Number(formatRep(live.people)),
    state: Number(formatRep(live.state)),
    underworld: Number(formatRep(live.underworld)),
  }
}

export function hurtsLowFaction(ad: Ad, rep: Reputation) {
  const change = reputationChange(ad.message)
  const current = rep || EMPTY_REP

  for (const faction of FACTIONS) {
    const wouldHurt = change[faction] < 0
    const alreadyLow = (current[faction] || 0) <= LOW_FACTION
    if (wouldHurt && alreadyLow) return true
  }
  return false
}

export function suggestAd(ads: Ad[], rep: Reputation = EMPTY_REP) {
  const safe = ads.filter((a) => !hurtsLowFaction(a, rep))
  return sortAds(safe.length ? safe : ads)[0] || null
}

export function lowFactions(rep: Reputation): Faction[] {
  return (['people', 'state', 'underworld'] as const).filter((k) => (rep[k] || 0) <= LOW_FACTION)
}
