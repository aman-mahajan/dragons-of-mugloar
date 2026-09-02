import type { Ad, GameStart, Purchase, Reputation, ShopItem, SolveResult } from "./types.ts";
import { decodeAd } from "./encrypted.ts";
import { EMPTY_REP, STALE_AFTER, suggestAd } from "./reputation.ts";

const HEALING_POTION_ID = "hpot";
const TARGET_LIVES = 5;
const MAX_CONSECUTIVE_ERRORS = 3;

export type GameApi = {
  startGame(): Promise<GameStart>
  getAds(gameId: string): Promise<Ad[]>
  solveAd(gameId: string, adId: string): Promise<SolveResult>
  getShop(gameId: string): Promise<ShopItem[]>
  buyItem(gameId: string, itemId: string): Promise<Purchase>
  getReputation(gameId: string): Promise<Reputation>
}

export async function playGame(api: GameApi) {
  const game = await api.startGame();
  console.log(`Game ${game.gameId} started with ${game.lives} lives`);

  let shop: ShopItem[] = [];
  try {
    shop = await api.getShop(game.gameId);
  } catch (error) {
    console.log(`Shop unavailable, playing without it: ${errorMsg(error)}`);
  }

  let lives = game.lives;
  let score = game.score;
  let gold = game.gold;
  let level = 0;
  let turns = 0;
  let turn = game.turn;
  let rep = EMPTY_REP;
  let repTurn = game.turn;
  let consecutiveErrors = 0;

  while (lives > 0) {
    turns += 1;
    try {
      if (turn - repTurn >= STALE_AFTER) {
        try {
          const rep = await api.getReputation(game.gameId);
          turn += 1;
          repTurn = turn;
          console.log(
            `Reputation checked: people=${formatRep(rep.people)} state=${rep.state} underworld=${rep.underworld}`
          );
        } catch (error) {
          console.log(`Reputation check failed, using stale values: ${errorMsg(error)}`);
        }
      }

      const ads = (await api.getAds(game.gameId))
        .map(decodeAd)
        .filter((ad): ad is Ad => ad !== null);

      const ad = suggestAd(ads, rep);
      if (!ad) {
        console.log("No solvable ad on the board, stopping");
        break;
      }

      const result = await api.solveAd(game.gameId, ad.adId);
      lives = result.lives;
      score = result.score;
      gold = result.gold;
      turn = result.turn;
      consecutiveErrors = 0;

      console.log(
        `Turn ${result.turn} ${result.success ? "WON " : "LOST"} ` +
          `reward=${ad.reward} p=${ad.probability} lives=${lives} gold=${gold} score=${score}`
      );

      if (lives > 0) {
        const item = chooseItem({ lives, gold }, shop);
        if (item) {
          const purchase = await api.buyItem(game.gameId, item.id);
          if (purchase.shoppingSuccess) {
            lives = purchase.lives;
            gold = purchase.gold;
            level = purchase.level;
            turn = purchase.turn;
            console.log(`Bought ${item.name} for ${item.cost}, lives=${lives} gold=${gold} level=${level}`);
          } else {
            console.log(`Could not buy ${item.name}, the shop refused the purchase`);
          }
        }
      }
    } catch (error) {
      consecutiveErrors += 1;
      console.log(`Turn failed (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}): ${errorMsg(error)}`);
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        console.log("Too many consecutive errors, abandoning this game");
        break;
      }
    }
  }

  return { gameId: game.gameId, score, lives, turns, level };
}

// Choose healing potion if lives < TARGET_LIVES. 
// else pick the best costliest option randomly if budget allows.
export function chooseItem(
  { lives, gold }: { lives: number; gold: number },
  items: ShopItem[]
): ShopItem | undefined {
  const potion = items.find((item) => item.id === HEALING_POTION_ID);
  if (potion && lives < TARGET_LIVES && gold >= potion.cost) return potion;

  const budget = gold - (potion?.cost ?? 0);
  return shuffleItems(items)
    .filter((item) => item.id !== HEALING_POTION_ID && item.cost <= budget)
    .reduce<ShopItem | undefined>(
      (best, item) => (best === undefined || item.cost > best.cost ? item : best),
      undefined
    );
}

function shuffleItems(list: ShopItem[]): ShopItem[] {
  const shuffledList = [...list];
  for (let i = shuffledList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledList[i], shuffledList[j]] = [shuffledList[j], shuffledList[i]];
  }
  return shuffledList;
}

const errorMsg = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const formatRep = (value: number): string => 
  Number(value || 0).toFixed(1);
