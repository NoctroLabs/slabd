export type Plan = 'founding' | 'free' | 'pro'

/** What each plan allows.
 *
 *  Mirrored in the iOS app's `Plans.swift` and in the database's
 *  `card_limit_for()`. The database is the one that actually enforces the card
 *  cap — a client check is a courtesy so people aren't surprised, not a
 *  barrier. These two must agree or somebody hits a wall the interface said
 *  wasn't there. */
export const FREE_CARD_LIMIT = 75

export type Feature = 'breaks' | 'wax' | 'insuranceReport' | 'csvImport'

export const FEATURE_NAMES: Record<Feature, string> = {
  breaks: 'Break tracking',
  wax: 'Wax tracking',
  insuranceReport: 'The insurance report',
  csvImport: 'CSV import',
}

/** Free gets everything that isn't listed here. Export is deliberately absent:
 *  getting your own data out is never gated — it's how you exercise your data
 *  rights, and the privacy policy says so. */
const PREMIUM_ONLY: Feature[] = ['breaks', 'wax', 'insuranceReport', 'csvImport']

export const isPaid = (plan: Plan | null) => plan === 'founding' || plan === 'pro'

export function allows(plan: Plan | null, feature: Feature): boolean {
  // Unknown plan is treated as paid. Settings can fail to load, and locking
  // somebody out of their own collection over a failed request is worse than
  // briefly showing a feature they'd have to be upsold on later.
  if (plan === null) return true
  return isPaid(plan) || !PREMIUM_ONLY.includes(feature)
}

export function cardLimit(plan: Plan | null): number | null {
  return plan === 'free' ? FREE_CARD_LIMIT : null
}

export function canAddCard(plan: Plan | null, currentCount: number): boolean {
  const limit = cardLimit(plan)
  return limit === null || currentCount < limit
}
