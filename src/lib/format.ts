import { formatMoney } from './currency'

/** Formats in the user's chosen currency, matching the app's `Money.format`.
 *  See `currency.ts` — switching relabels amounts rather than converting them. */
export const money = formatMoney

export const signedMoney = (value: number) =>
  `${value >= 0 ? '+' : '−'}${money(Math.abs(value))}`

/** Comp value minus paid if kept, sold price minus paid if sold — the same
 *  rule as `Card.profitLoss` in the app. */
export const profitLoss = (c: {
  status: string
  price_paid: number | null
  comp_value: number | null
  sold_price: number | null
}): number | null => {
  // A held card is measured against what it's worth; a sold one against what
  // it actually fetched.
  const worth = c.status === 'Sold' ? c.sold_price : c.comp_value

  // No valuation means no profit figure — not a loss.
  //
  // This previously read `comp_value ?? 0`, which concluded that a card you
  // hadn't valued yet was worth nothing and showed the full purchase price as
  // a loss, in red. Log twenty cards without valuing them and the dashboard
  // reported losing everything you'd ever spent.
  if (worth == null) return null

  // A missing cost is still treated as zero, matching how "total paid" sums:
  // a card recorded without a price genuinely cost nothing as far as the
  // collection knows, whereas an unvalued card's worth is simply unknown.
  return worth - (c.price_paid ?? 0)
}

/** Renders a stored date for reading: 18/08/2026.
 *
 *  Dates are stored and exchanged as ISO (YYYY-MM-DD) — that's what a Postgres
 *  date column gives back, and it's the only unambiguous way to move a date
 *  between two clients. This is purely how it's shown.
 *
 *  Four-digit year deliberately. A two-digit one saves two characters and
 *  loses the century, and "05/09/26" is the exact shape that gets misread as
 *  a US date; the whole point of a fixed display format is removing that
 *  doubt.
 *
 *  Parsed as UTC rather than local. `new Date('2026-08-18')` is midnight UTC,
 *  which in any timezone behind UTC renders as the 17th — a date that silently
 *  shifts by one day depending on where you're standing is worse than no
 *  formatting at all. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  // Anything not ISO-shaped is shown as-is rather than mangled into
  // "NaN/NaN/NaN".
  if (!match) return iso
  const [, year, month, day] = match
  return `${day}/${month}/${year}`
}
