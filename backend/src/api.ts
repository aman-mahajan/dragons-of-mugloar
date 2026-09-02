import type { Ad, GameStart, Purchase, Reputation, ShopItem, SolveResult } from "./types.ts";

const BASE_URL = "https://dragonsofmugloar.com/api/v2";

async function request<T>(method: string, path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`${method} ${path} ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export class ApiClient {
  startGame() {
    return request<GameStart>("POST", "/game/start");
  }

  getAds(gameId: string) {
    return request<Ad[]>("GET", `/${encodeURIComponent(gameId)}/messages`);
  }

  solveAd(gameId: string, adId: string) {
    return request<SolveResult>(
      "POST",
      `/${encodeURIComponent(gameId)}/solve/${encodeURIComponent(adId)}`
    );
  }

  getShop(gameId: string) {
    return request<ShopItem[]>("GET", `/${encodeURIComponent(gameId)}/shop`);
  }

  buyItem(gameId: string, itemId: string) {
    return request<Purchase>(
      "POST",
      `/${encodeURIComponent(gameId)}/shop/buy/${encodeURIComponent(itemId)}`
    );
  }

  getReputation(gameId: string) {
    return request<Reputation>(
      "POST",
      `/${encodeURIComponent(gameId)}/investigate/reputation`
    );
  }
}
