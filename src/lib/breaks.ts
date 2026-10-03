import type { Card } from './types'
import { profitLoss } from './format'

/** Mirrors the `breaks` table, and the app's `Break` model. A break carries
 *  no cost itself — you pay for spots within it. */
export interface Break {
  id: string
  user_id: string | null
  name: string
  break_date: string | null
  seller: string | null
  notes: string | null
}

/** A single paid spot within a break. Cards pulled from it link back via
 *  `Card.break_spot_id`. */
export interface BreakSpot {
  id: string
  break_id: string
  user_id: string | null
  name: string
  cost: number
}

export const hitsFor = (cards: Card[], spotId: string) =>
  cards.filter((c) => c.break_spot_id === spotId)

/** A spot's profit or loss.
 *
 *  The one special case, carried over from the app: a spot with **no hits at
 *  all** is a total loss of its cost, not zero. Summing an empty list would
 *  read as break-even, which is actively misleading for a spot that whiffed. */
export function spotProfitLoss(spot: BreakSpot, cards: Card[]): number {
  const linked = hitsFor(cards, spot.id)
  if (linked.length === 0) return -spot.cost
  return linked.reduce((sum, c) => sum + (profitLoss(c) ?? 0), 0)
}

/** Cost split evenly across a spot's hits, rounded to the penny exactly as
 *  the app rounds it. This is the number written back to each linked card's
 *  `price_paid`, which is what keeps Total Paid correct everywhere else
 *  without break-sourced cards needing special handling. */
export function perHitCost(spot: BreakSpot, hitCount: number): number | null {
  if (hitCount === 0) return null
  return Math.round((spot.cost / hitCount) * 100) / 100
}

export interface SellerStats {
  seller: string
  breakCount: number
  spotCount: number
  spend: number
  spotsHit: number
  profit: number
  hitRate: number | null
}

export interface BreakRollup {
  cost: number
  hits: number
  spotCount: number
  profit: number
}

export interface BreakStats {
  totalSpend: number
  totalHits: number
  profit: number
  /** Spots that hit at least once, over every spot bought. The clearest
   *  single measure of whether breaking is paying off — profit alone can be
   *  flattered by one big hit covering a run of dead spots. */
  hitRate: number | null
  costPerHit: number | null
  bySeller: SellerStats[]
  /** Keyed by break id. */
  rollup: Record<string, BreakRollup>
}

export function deriveBreakStats(
  breaks: Break[],
  spots: BreakSpot[],
  cards: Card[],
): BreakStats {
  const totalSpend = spots.reduce((sum, s) => sum + s.cost, 0)
  const totalHits = spots.reduce((sum, s) => sum + hitsFor(cards, s.id).length, 0)
  const profit = spots.reduce((sum, s) => sum + spotProfitLoss(s, cards), 0)

  const rollup: Record<string, BreakRollup> = {}
  for (const brk of breaks) {
    const mine = spots.filter((s) => s.break_id === brk.id)
    rollup[brk.id] = {
      cost: mine.reduce((sum, s) => sum + s.cost, 0),
      hits: mine.reduce((sum, s) => sum + hitsFor(cards, s.id).length, 0),
      spotCount: mine.length,
      profit: mine.reduce((sum, s) => sum + spotProfitLoss(s, cards), 0),
    }
  }

  const bySellerMap = new Map<string, SellerStats>()
  for (const brk of breaks) {
    const named = (brk.seller ?? '').trim()
    const seller = named === '' ? 'Unknown Seller' : named
    const stats =
      bySellerMap.get(seller) ??
      { seller, breakCount: 0, spotCount: 0, spend: 0, spotsHit: 0, profit: 0, hitRate: null }

    stats.breakCount += 1
    for (const spot of spots.filter((s) => s.break_id === brk.id)) {
      stats.spotCount += 1
      stats.spend += spot.cost
      if (hitsFor(cards, spot.id).length > 0) stats.spotsHit += 1
      stats.profit += spotProfitLoss(spot, cards)
    }
    bySellerMap.set(seller, stats)
  }

  const bySeller = [...bySellerMap.values()]
    .map((s) => ({ ...s, hitRate: s.spotCount === 0 ? null : s.spotsHit / s.spotCount }))
    // Ranked by how often you buy from them, not by profit — this is the
    // "am I going back to the same well" view.
    .sort((a, b) => (b.breakCount - a.breakCount) || (b.spend - a.spend))

  return {
    totalSpend,
    totalHits,
    profit,
    hitRate: spots.length === 0 ? null : spots.filter((s) => hitsFor(cards, s.id).length > 0).length / spots.length,
    costPerHit: totalHits === 0 ? null : totalSpend / totalHits,
    bySeller,
    rollup,
  }
}

/** Most recent break first, by when the break happened rather than when it
 *  was logged. */
export const orderBreaks = (breaks: Break[]) =>
  [...breaks].sort((a, b) => (b.break_date ?? '').localeCompare(a.break_date ?? ''))

export const percent = (rate: number) => `${Math.round(rate * 100)}%`
