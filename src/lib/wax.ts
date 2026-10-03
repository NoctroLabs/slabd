import type { Card, Wax } from './types'
import { isSealed, sealedProfit } from './types'

/** Totals for the wax page.
 *
 *  Sealed and opened boxes are kept apart because they answer different
 *  questions. A sealed box is an asset — what's it worth against what I paid.
 *  An opened one is a bet already settled — did the cards beat the box. One
 *  combined "wax" figure answers neither.
 *
 *  Mirrors `WaxListView` in the app, including the part that matters most:
 *  unvalued means unknown, not zero. Counting an unpriced hit as worthless is
 *  the mistake that made every unvalued card show a full loss before
 *  `profitLoss` was fixed. */
export interface WaxStats {
  sealedCount: number
  sealedSpend: number
  /** Only boxes with a value recorded. */
  sealedValue: number
  sealedPL: number
  unvaluedSealed: number

  openedCount: number
  openedSpend: number
  /** Comp value of the cards logged out of opened boxes, counting only the
   *  ones actually valued — so this is a floor, not a verdict. */
  pulledValue: number
  /** `pulledValue` minus what those boxes cost. */
  openedPL: number
  unvaluedPulls: number
}

export function deriveWaxStats(wax: Wax[], cards: Card[]): WaxStats {
  const sealed = wax.filter(isSealed)
  const opened = wax.filter((w) => !isSealed(w))
  const fromBox = (id: string) => cards.filter((c) => c.wax_id === id)

  const pulled = opened.flatMap((w) => fromBox(w.id))
  const pulledValue = pulled.reduce((s, c) => s + (c.comp_value ?? 0), 0)
  const openedSpend = opened.reduce((s, w) => s + (w.price_paid ?? 0), 0)

  return {
    sealedCount: sealed.length,
    sealedSpend: sealed.reduce((s, w) => s + (w.price_paid ?? 0), 0),
    sealedValue: sealed.reduce((s, w) => s + (w.comp_value ?? 0), 0),
    sealedPL: sealed.reduce((s, w) => s + (sealedProfit(w) ?? 0), 0),
    unvaluedSealed: sealed.filter((w) => w.comp_value == null).length,

    openedCount: opened.length,
    openedSpend,
    pulledValue,
    openedPL: pulledValue - openedSpend,
    unvaluedPulls: pulled.filter((c) => c.comp_value == null).length,
  }
}

/** What each card out of a box is charged: the box price divided by the cards
 *  logged from it.
 *
 *  The database writes the real figure; this is for showing the rule up front,
 *  because nobody expects logging one more card to change the cost of the
 *  cards already logged. */
export function costPerCard(box: Wax, pulledCount: number): number | null {
  if (box.price_paid == null || pulledCount === 0) return null
  return box.price_paid / pulledCount
}

export const cardsFromWax = (cards: Card[], waxId: string) =>
  cards.filter((c) => c.wax_id === waxId)
