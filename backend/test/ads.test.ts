import { expect, test } from "vitest";

import { sortAds } from "../src/ads.ts";
import type { Ad } from "../src/types.ts";

const ad = (overrides: Partial<Ad> = {}): Ad => ({
  adId: "id",
  message: "do a thing",
  reward: 10,
  expiresIn: 5,
  encrypted: null,
  probability: "Sure thing",
  ...overrides,
});

test("sorts by safest probability, then reward", () => {
  const sorted = sortAds([
    ad({ adId: "risky", probability: "Risky", reward: 500 }),
    ad({ adId: "safe-low", probability: "Sure thing", reward: 5 }),
    ad({ adId: "safe-high", probability: "Sure thing", reward: 50 }),
  ]);

  expect(sorted.map((a) => a.adId)).toEqual(["safe-high", "safe-low", "risky"]);
});
