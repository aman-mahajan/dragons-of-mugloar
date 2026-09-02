#!/usr/bin/env node
import { pathToFileURL } from "node:url";

import { ApiClient } from "./src/api.ts";
import { playGame } from "./src/game.ts";

export function parseParams(params: string[]): { games: number } {
  let games = 1;

  for (const param of params) {
    const match = /^--games=(.*)$/.exec(param);
    if (!match) throw new Error(`unknown argument "${param}"`);

    games = Number(match[1]);
    if (!Number.isInteger(games) || games < 1) {
      throw new Error(`--games must be a positive integer, got "${match[1]}"`);
    }
  }

  return { games };
}

async function main(params: string[]): Promise<void> {
  const { games } = parseParams(params);
  const api = new ApiClient();

  const scores: number[] = [];
  for (let i = 1; i <= games; i += 1) {
    if (games > 1) console.log(`--- game ${i}/${games}`);
    const result = await playGame(api);
    console.log(
      `Final score: ${result.score} (lives left ${result.lives}, turns played ${result.turns})`
    );
    scores.push(result.score);
  }

  if (games > 1) {
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const cleared = scores.filter((score) => score >= 1000).length;
    console.log(
      `\n${games} games: best ${Math.max(...scores)}, worst ${Math.min(...scores)}, ` +
        `average ${average.toFixed(1)}, reached 1000+ in ${cleared}/${games}`
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await main(process.argv.slice(2));
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
