import { expect, test } from "vitest";

import type {
  Ad,
  GameStart,
  Purchase,
  Reputation,
  ShopItem,
  SolveResult,
} from "../src/types.ts";
import { chooseItem, playGame } from "../src/game.ts";

const ad = (adId = "a1"): Ad => ({
  adId,
  message: "do a thing",
  reward: 10,
  expiresIn: 5,
  encrypted: null,
  probability: "Sure thing",
});

const startedGame: GameStart = { gameId: "g1", lives: 3, gold: 0, score: 0, turn: 0 };

const solved = (overrides: Partial<SolveResult> = {}): SolveResult => ({
  success: true,
  lives: 3,
  gold: 0,
  score: 0,
  turn: 0,
  message: "",
  ...overrides,
});

const bought = (overrides: Partial<Purchase> = {}): Purchase => ({
  shoppingSuccess: true,
  gold: 0,
  lives: 3,
  level: 1,
  turn: 0,
  ...overrides,
});

interface mockApis {
  ads?: Array<Ad[] | Error>;
  solves?: Array<SolveResult | Error>;
  purchases?: Array<Purchase | Error>;
  reputations?: Array<Reputation | Error>;
  start?: GameStart | Error;
  shop?: ShopItem[] | Error;
};

function mockApi({
  ads = [],
  solves = [],
  purchases = [],
  reputations = [],
  start = startedGame,
  shop = [],
}: mockApis = {}) {
  const calls = {
    ads: 0,
    solves: 0,
    reputation: 0,
    bought: [] as string[],
    solved: [] as string[],
  };

  const api = {
    async startGame() {
      if (start instanceof Error) throw start;
      return start;
    },
    async getAds() {
      calls.ads += 1;
      const next = ads.shift() ?? [ad()];
      if (next instanceof Error) throw next;
      return next;
    },
    async solveAd(_gameId: string, adId: string) {
      calls.solves += 1;
      calls.solved.push(adId);
      const next = solves.shift() ?? solved();
      if (next instanceof Error) throw next;
      return next;
    },
    async getShop() {
      if (shop instanceof Error) throw shop;
      return shop;
    },
    async buyItem(_gameId: string, itemId: string) {
      calls.bought.push(itemId);
      const next = purchases.shift() ?? bought();
      if (next instanceof Error) throw next;
      return next;
    },
    async getReputation() {
      calls.reputation += 1;
      const next = reputations.shift() ?? { people: 0, state: 0, underworld: 0 };
      if (next instanceof Error) throw next;
      return next;
    },
  };

  return { api, calls };
}

test("plays until the lives run out and returns the final score", async () => {
  const { api, calls } = mockApi({
    solves: [
      solved({ success: false, lives: 2, score: 0, turn: 1 }),
      solved({ lives: 2, score: 40, turn: 2 }),
      solved({ success: false, lives: 1, score: 40, turn: 3 }),
      solved({ success: false, lives: 0, score: 40, turn: 4 }),
    ],
  });

  const result = await playGame(api);

  expect(result).toEqual({ gameId: "g1", score: 40, lives: 0, turns: 4, level: 0 });
  expect(calls.solves).toBe(4);
});

test("stops when no ad on the board is solvable", async () => {
  const { api, calls } = mockApi({ ads: [[{ ...ad(), encrypted: 9 }]] });

  const result = await playGame(api);

  expect(result.turns).toBe(1);
  expect(result.lives, "the game is abandoned, not lost").toBe(3);
  expect(calls.solves).toBe(0);
});

test("abandons the game after too many consecutive errors", async () => {
  const { api, calls } = mockApi({
    ads: [
      new Error("network down"),
      new Error("network down"),
      new Error("network down"),
    ],
  });

  const result = await playGame(api);

  expect(calls.ads).toBe(3);
  expect(result.score).toBe(0);
});

test("a single failing turn does not end the game", async () => {
  const { api } = mockApi({
    ads: [new Error(), [ad()]],
    solves: [solved({ lives: 0, score: 25, turn: 1 })],
  });

  const result = await playGame(api);

  expect(result.score).toBe(25);
  expect(result.turns, "one recovered error plus one played turn").toBe(2);
});

const POTION: ShopItem = { id: "hpot", name: "Healing potion", cost: 50 };

test("spends the reward on a potion after losing a life", async () => {
  const { api, calls } = mockApi({
    shop: [POTION],
    solves: [
      solved({ success: false, lives: 2, gold: 60, score: 0, turn: 1 }),
      solved({ lives: 0, gold: 10, score: 30, turn: 3 }),
    ],
    purchases: [bought({ lives: 3, gold: 10, level: 0 })],
  });

  const result = await playGame(api);

  expect(calls.bought).toEqual(["hpot"]);
  expect(result.score).toBe(30);
});

test("keeps playing when the shop cannot be reached", async () => {
  const { api, calls } = mockApi({
    shop: new Error("shop is closed"),
    solves: [solved({ lives: 0, gold: 90, score: 15, turn: 1 })],
  });

  const result = await playGame(api);

  expect(result.score, "an unreachable shop is not a game over").toBe(15);
  expect(calls.bought).toEqual([]);
});

test("a refused purchase costs the turn but not the game", async () => {
  const { api } = mockApi({
    shop: [POTION],
    solves: [
      solved({ success: false, lives: 2, gold: 60, score: 0, turn: 1 }),
      solved({ lives: 0, gold: 60, score: 20, turn: 2 }),
    ],
    purchases: [bought({ shoppingSuccess: false, lives: 2, gold: 60, level: 0 })],
  });

  const result = await playGame(api);

  expect(result.score).toBe(20);
  expect(result.turns).toBe(2);
});

const SHOP: ShopItem[] = [
  { id: "hpot", name: "Healing potion", cost: 50 },
  { id: "cs", name: "Claw Sharpening", cost: 100 },
  { id: "ch", name: "Claw Honing", cost: 300 },
];

test("gets to five lives, then buys the best upgrade it can still get after", () => {
  expect(chooseItem({ lives: 2, gold: 50 }, SHOP)?.id).toBe("hpot");
  expect(chooseItem({ lives: 3, gold: 350 }, SHOP)?.id).toBe("hpot");
  expect(chooseItem({ lives: 5, gold: 350 }, SHOP)?.id).toBe("ch");
  expect(chooseItem({ lives: 5, gold: 300 }, SHOP)?.id).toBe("cs");
  expect(chooseItem({ lives: 5, gold: 149 }, SHOP)).toBeUndefined();
});

const ENCODED_AD: Ad = {
  adId: "TjZzS1Vpa0s=",
  message: "SW5maWx0cmF0ZSBUaGUgSmFja2FscyBhbmQgcmVjb3ZlciB0aGVpciBzZWNyZXRzLg==",
  reward: 176,
  expiresIn: 3,
  encrypted: 1,
  probability: "U3VpY2lkZSBtaXNzaW9u",
};

test("checks reputation once it has been three turns since the last check", async () => {
  const { api, calls } = mockApi({
    solves: [
      solved({ lives: 3, score: 10, turn: 1 }),
      solved({ lives: 3, score: 20, turn: 2 }),
      solved({ lives: 3, score: 30, turn: 3 }),
      solved({ lives: 0, score: 40, turn: 4 }),
    ],
    reputations: [{ people: 1, state: -1, underworld: 0 }],
  });

  const result = await playGame(api);

  expect(calls.reputation).toBe(1);
  expect(calls.solves).toBe(4);
  expect(result.score).toBe(40);
});

test("solves a decoded ad using its decoded id", async () => {
  const { api, calls } = mockApi({
    ads: [[ENCODED_AD]],
    solves: [solved({ lives: 0, score: 176, turn: 1 })],
  });

  const result = await playGame(api);

  expect(calls.solved, "the encoded id is rejected with HTTP 400").toEqual(["N6sKUikK"]);
  expect(result.score).toBe(176);
});
