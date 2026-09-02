import { Ad, BuyResult, Game, Reputation, ShopItem, SolveResult } from './types'

const BASE = 'https://dragonsofmugloar.com/api/v2'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, options)
  const text = await res.text()
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    const plain = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    throw new Error(plain.slice(0, 200) || `HTTP ${res.status}`)
  }
  if (!res.ok) {
    const rec = data as { message?: string; status?: string; error?: string }
    const msg = rec.message || rec.status || rec.error || `HTTP ${res.status}`
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(data))
  }
  return data as T
}

export function startGame() {
  return request<Game>('/game/start', { method: 'POST' })
}

export function getMessages(gameId: string) {
  return request<Ad[]>(`/${gameId}/messages`)
}

export function solveAd(gameId: string, adId: string) {
  return request<SolveResult>(
    `/${gameId}/solve/${encodeURIComponent(adId)}`,
    { method: 'POST' },
  )
}

export function getShop(gameId: string) {
  return request<ShopItem[]>(`/${gameId}/shop`)
}

export function buyItem(gameId: string, itemId: string) {
  return request<BuyResult>(
    `/${gameId}/shop/buy/${encodeURIComponent(itemId)}`,
    { method: 'POST' },
  )
}

export function getReputation(gameId: string) {
  return request<Reputation>(`/${gameId}/investigate/reputation`, { method: 'POST' })
}

export function errMessage(e: unknown) {
  return e instanceof Error ? e.message : String(e)
}
