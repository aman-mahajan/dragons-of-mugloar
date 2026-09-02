export interface Game {
  gameId: string
  lives: number
  gold: number
  level: number
  score: number
  highScore: number
  turn: number
}

export interface SolveResult {
  success: boolean
  lives: number
  gold: number
  score: number
  highScore: number
  turn: number
  message?: string
}

export interface BuyResult {
  shoppingSuccess: boolean
  gold: number
  lives: number
  level: number
  turn: number
}

export interface Ad {
  adId: string
  message: string
  reward: number
  expiresIn: number
  encrypted?: number | string | null
  probability: string
}

export interface ShopItem {
  id: string
  name: string
  cost: number
}

export interface Reputation {
  people: number
  state: number
  underworld: number
}

export type Faction = keyof Reputation

export type RiskLevel = 'safe' | 'okay' | 'risky' | 'deadly' | 'impossible' | 'unknown'

export type AdKind = 'steal' | 'kill' | 'help'
