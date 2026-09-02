import { expect, test } from "vitest";

import type { Ad, Reputation } from "../src/types.ts";
import {
  adKind,
  hurtsLowFaction,
  reputationChange,
  suggestAd,
} from "../src/reputation.ts";

const ad = (overrides: Partial<Ad> = {}): Ad => ({
  adId: "id",
  message: "help the villagers",
  reward: 10,
  expiresIn: 5,
  encrypted: null,
  probability: "Sure thing",
  ...overrides,
});

test("classifies ad kinds from message keywords", () => {
  expect(adKind("steal a horse")).toBe("steal");
  expect(adKind("kill the bandit")).toBe("kill");
  expect(adKind("murder the king")).toBe("kill");
  expect(adKind("deliver supplies")).toBe("help");
});

test("maps ad kinds to reputation changes", () => {
  expect(reputationChange("steal gold")).toEqual({ people: 1, state: -2, underworld: 0 });
  expect(reputationChange("kill the guard")).toEqual({ people: -2, state: 0, underworld: 1 });
  expect(reputationChange("help farmers")).toEqual({ people: 0.1, state: 0, underworld: 0 });
});

test("flags ads that would hurt an already-low faction", () => {
  const steal = ad({ message: "steal the crown jewels" });
  const kill = ad({ adId: "kill", message: "kill the mayor" });
  const lowState: Reputation = { people: 0, state: -2, underworld: 0 };
  const lowPeople: Reputation = { people: -2, state: 0, underworld: 0 };

  expect(hurtsLowFaction(steal, lowState)).toBe(true);
  expect(hurtsLowFaction(kill, lowPeople)).toBe(true);
  expect(hurtsLowFaction(ad(), lowState)).toBe(false);
});

test("picks the safest ad when reputation is neutral", () => {
  const risky = ad({ adId: "risky", probability: "Risky", reward: 500 });
  const safe = ad({ adId: "safe", probability: "Sure thing", reward: 5 });

  expect(suggestAd([risky, safe])?.adId).toBe("safe");
});

test("avoids steal ads when state reputation is low", () => {
  const steal = ad({ adId: "steal", message: "steal the treasury", probability: "Sure thing" });
  const help = ad({ adId: "help", message: "help the baker", probability: "Gamble" });
  const rep: Reputation = { people: 0, state: -2.5, underworld: 0 };

  expect(suggestAd([steal, help], rep)?.adId).toBe("help");
});

test("avoids kill ads when people reputation is low", () => {
  const kill = ad({ adId: "kill", message: "kill the guard", probability: "Sure thing" });
  const help = ad({ adId: "help", message: "help the baker", probability: "Gamble" });
  const rep: Reputation = { people: -3, state: 0, underworld: 0 };

  expect(suggestAd([kill, help], rep)?.adId).toBe("help");
});

test("falls back to all ads when every option hurts a low faction", () => {
  const steal = ad({ adId: "steal", message: "steal gold", probability: "Sure thing" });
  const kill = ad({ adId: "kill", message: "kill the guard", probability: "Gamble" });
  const rep: Reputation = { people: -3, state: -3, underworld: 0 };

  expect(suggestAd([steal, kill], rep)?.adId).toBe("steal");
});

test("returns undefined for an empty board", () => {
  expect(suggestAd([])).toBeUndefined();
});
