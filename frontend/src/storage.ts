import { Game, Reputation } from "./types";

export interface SavedSession {
  game: Game;
  rep: Reputation;
  repTurn: number;
}

const GAME_KEY = "mugloar.currentGame";
const SCORE_KEY = "mugloar.maxScore";
const RECS_KEY = "mugloar.recommendations";

export function loadGame(): SavedSession | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(GAME_KEY) || "null");
    if (!parsed?.game?.gameId) return null;
    if (Number(parsed.game.lives) <= 0) {
      localStorage.removeItem(GAME_KEY);
      return null;
    }
    return {
      game: parsed.game,
      rep: parsed.rep,
      repTurn: parsed.repTurn ?? 0,
    };
  } catch {
    return null;
  }
}

export function saveGame(session: SavedSession) {
  localStorage.setItem(GAME_KEY, JSON.stringify(session));
  noteScore(session.game.score);
}

export function clearGame() {
  localStorage.removeItem(GAME_KEY);
}

export function loadMaxScore() {
  const n = Number(localStorage.getItem(SCORE_KEY) || 0);
  return Number.isFinite(n) ? n : 0;
}

export function noteScore(score: number) {
  if (score > loadMaxScore()) localStorage.setItem(SCORE_KEY, String(score));
}

export function loadRecs() {
  return localStorage.getItem(RECS_KEY) === "1";
}

export function saveRecs(on: boolean) {
  localStorage.setItem(RECS_KEY, on ? "1" : "0");
}
