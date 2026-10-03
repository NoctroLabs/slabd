import type { Card, Wax } from './types'
import { isSealed, sealedProfit } from './types'
import { profitLoss } from './format'

export interface Stats {
  count: number
  totalPaid: number
  /** Comp value of cards still held. Sold cards are excluded because their
   *  value has already been realised, which is the same rule the app's
   *  summary uses. */
  heldValue: number
  profit: number
  averageValue: number
  byCategory: { label: string; value: number; count: number }[]
  byStatus: { label: string; count: number }[]
  topCards: Card[]
  /** Sealed boxes with no value recorded, so the interface can say why they
   *  aren't in the figures rather than leaving a silent gap. */
  unvaluedSealed: number
}

/** Totals across the collection.
 *
 *  Sealed wax counts; opened wax doesn't. An opened box's cost has already
 *  been allocated onto the cards that came out of it, so counting the box as
 *  well would charge the same money twice. An unvalued box contributes
 *  nothing to value, exactly as an unvalued card does — matching
 *  `CardStore.totalCompValueKept` in the app, which has to agree with this or
 *  the same collection reads two different totals depending which you opened.
 */
export function deriveStats(cards: Card[], wax: Wax[] = []): Stats {
  const sealed = wax.filter(isSealed)
  const sealedSpend = sealed.reduce((s, w) => s + (w.price_paid ?? 0), 0)
  const sealedValue = sealed.reduce((s, w) => s + (w.comp_value ?? 0), 0)
  const sealedPL = sealed.reduce((s, w) => s + (sealedProfit(w) ?? 0), 0)

  const held = cards.filter((c) => c.status !== 'Sold')
  const totalPaid = cards.reduce((s, c) => s + (c.price_paid ?? 0), 0) + sealedSpend
  const heldValue = held.reduce((s, c) => s + (c.comp_value ?? 0), 0) + sealedValue
  // Unvalued cards contribute nothing rather than a phantom loss.
  const profit = cards.reduce((s, c) => s + (profitLoss(c) ?? 0), 0) + sealedPL

  const catMap = new Map<string, { value: number; count: number }>()
  for (const c of held) {
    const k = c.category || 'Other'
    const prev = catMap.get(k) ?? { value: 0, count: 0 }
    catMap.set(k, { value: prev.value + (c.comp_value ?? 0), count: prev.count + 1 })
  }

  const statusMap = new Map<string, number>()
  for (const c of cards) statusMap.set(c.status, (statusMap.get(c.status) ?? 0) + 1)

  return {
    count: cards.length,
    totalPaid,
    heldValue,
    profit,
    // Deliberately excludes sealed wax: this is the average value of a card,
    // and a box is not a card. Including it would make the average of 80
    // cards move because a blaster was logged.
    averageValue: held.length ? (heldValue - sealedValue) / held.length : 0,
    byCategory: [...catMap.entries()]
      .map(([label, v]) => ({ label, ...v }))
      .sort((a, b) => b.value - a.value),
    byStatus: ['Kept', 'For Sale', 'Sold']
      .map((label) => ({ label, count: statusMap.get(label) ?? 0 }))
      .filter((s) => s.count > 0),
    topCards: [...held]
      .filter((c) => (c.comp_value ?? 0) > 0)
      .sort((a, b) => (b.comp_value ?? 0) - (a.comp_value ?? 0))
      .slice(0, 6),
    unvaluedSealed: sealed.filter((w) => w.comp_value == null).length,
  }
}
