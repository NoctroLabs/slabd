import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { allows, canAddCard, cardLimit, isPaid, type Feature, type Plan } from '../lib/plans'

/** Which plan the account is on.
 *
 *  Everyone who signs up during beta is stamped `founding` by a trigger, and
 *  keeps the full app for good. Nothing is enforced yet — this is here so the
 *  app can say so, and so the promise is recorded from the start rather than
 *  reconstructed from sign-up dates later. */
export function usePlan() {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let live = true
    supabase
      .from('user_settings')
      .select('plan')
      .maybeSingle()
      .then(({ data }) => {
        if (!live) return
        setPlan((data?.plan as Plan) ?? null)
        setLoading(false)
      })
    return () => {
      live = false
    }
  }, [])

  return {
    plan,
    loading,
    isFounding: plan === 'founding',
    isPaid: isPaid(plan),
    limit: cardLimit(plan),
    allows: (feature: Feature) => allows(plan, feature),
    canAddCard: (count: number) => canAddCard(plan, count),
  }
}
