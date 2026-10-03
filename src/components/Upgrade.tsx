import { Link } from 'react-router-dom'
import { FEATURE_NAMES, FREE_CARD_LIMIT, type Feature } from '../lib/plans'

/** Shown in place of a Premium feature on the free plan.
 *
 *  Deliberately not a modal. A dialog you have to dismiss to get back to the
 *  app reads as an obstacle; a panel where the feature would have been says
 *  the same thing without taking the screen hostage, and it leaves the rest of
 *  the page usable.
 *
 *  It never says "upgrade now" — nothing is on sale yet. During beta this is
 *  an explanation, not a sales pitch. */
export function PremiumPanel({ feature }: { feature: Feature }) {
  return (
    <div className="rounded-2xl border border-brass/30 bg-brass/[0.04] p-6">
      <p className="font-display text-[0.7rem] tracking-[0.16em] text-brass uppercase">Premium</p>
      <h3 className="font-display mt-2 text-[1.15rem] font-bold text-primary">
        {FEATURE_NAMES[feature]} is part of Premium
      </h3>
      <p className="mt-2 max-w-prose text-[0.92rem] leading-relaxed text-secondary">
        Everything you've already logged stays exactly as it is, and exporting your collection is
        free on every plan.
      </p>
      <Link
        to="/pricing"
        className="mt-5 inline-block rounded-full border border-brass/50 px-5 py-2.5 text-[0.88rem] text-brass-bright transition-colors hover:bg-brass/10"
      >
        What's in Premium
      </Link>
    </div>
  )
}

/** Sits above the card list once a free account is near or at the cap. */
export function CardLimitNotice({ count }: { count: number }) {
  const atLimit = count >= FREE_CARD_LIMIT
  const remaining = FREE_CARD_LIMIT - count

  // Silent until it's close enough to matter. Nagging somebody at card 12
  // about a limit at 75 is just noise.
  if (!atLimit && remaining > 10) return null

  return (
    <div
      className={`mb-5 rounded-xl border p-4 ${
        atLimit ? 'border-brass/50 bg-brass/[0.06]' : 'border-hairline bg-raised'
      }`}
    >
      <p className="text-[0.9rem] text-primary">
        {atLimit
          ? `You've filled your free plan's ${FREE_CARD_LIMIT} cards.`
          : `${remaining} card${remaining === 1 ? '' : 's'} left on your free plan.`}
      </p>
      <p className="mt-1 text-[0.86rem] leading-relaxed text-secondary">
        {atLimit
          ? 'Everything here stays yours to view, edit and export — you just can’t add a new one until you upgrade.'
          : 'Premium removes the cap.'}{' '}
        <Link to="/pricing" className="text-brass-bright">
          See what's included
        </Link>
        .
      </p>
    </div>
  )
}
