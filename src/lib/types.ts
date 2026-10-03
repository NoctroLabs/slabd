/** Mirrors the `cards` table, and so the iOS app's `Card` model. Snake_case
 *  here because these come straight back from PostgREST unmapped. */
export interface Card {
  id: string
  user_id: string | null
  category: string
  player: string
  year: string | null
  set_name: string | null
  auto_type: string | null
  serial_num: string | null
  serial_total: string | null
  serial_kind: string | null
  source: string | null
  seller: string | null
  price_paid: number | null
  date_acquired: string | null
  comp_value: number | null
  comp_notes: string | null
  status: string
  sold_price: number | null
  sold_date: string | null
  notes: string | null
  image_path: string | null
  thumb_path: string | null
  grade: string | null
  unique_serial: string | null
  break_spot_id: string | null
  /** The sealed box this card came out of. Mutually exclusive with
   *  `break_spot_id` — a card has one cost basis, and the database refuses
   *  both, because two allocation triggers would each write `price_paid`. */
  wax_id: string | null
}

/** Sealed product bought and opened by the collector. Mirrors `Wax` in the
 *  app; the allocation rule lives in the database so both obey it. */
export interface Wax {
  id: string
  user_id: string | null
  product: string
  format: string
  acquisition: string
  status: string
  price_paid: number | null
  /** What it cost at retail, so the premium paid on the secondary market is
   *  answerable rather than lost. */
  msrp: number | null
  /** What a sealed one goes for now. Only meaningful while sealed — once it's
   *  open, the value is in the cards. */
  comp_value: number | null
  seller: string | null
  purchase_date: string | null
  notes: string | null
}

export const WAX_FORMATS = ['Pack', 'Blaster', 'Hanger', 'Retail Box', 'Hobby Box', 'Case', 'Other'] as const
export const WAX_ACQUISITION = ['Retail', 'Secondary'] as const
export const WAX_STATUS = ['Sealed', 'Opened'] as const

export const isSealed = (w: Wax) => w.status === 'Sealed'

/** Gain or loss on a sealed box. Null when it has no value recorded — the
 *  same rule as `profitLoss` for a card, where unvalued means unknown rather
 *  than worthless. */
export function sealedProfit(w: Wax): number | null {
  if (!isSealed(w) || w.comp_value == null) return null
  return w.comp_value - (w.price_paid ?? 0)
}

/** The premium paid over retail, when both figures are known and it was more
 *  than retail. */
export function premiumOverMSRP(w: Wax): number | null {
  if (w.price_paid == null || w.msrp == null || w.msrp <= 0) return null
  return w.price_paid > w.msrp ? w.price_paid - w.msrp : null
}

/** The shape the public `card-data` edge function returns. Deliberately a
 *  narrower set than `Card` — no prices, seller or notes — so the
 *  verification page can never render something private. */
export interface PublicCard {
  player: string
  year: string | null
  setName: string | null
  autoType: string | null
  serialNum: string | null
  serialTotal: string | null
  serialKind: string | null
  grade: string | null
  uniqueSerial: string
  imageUrl: string | null
}

/** PSA-style grade names, matching `VaultSlabFrame.gradeNames` in the app. */
export const GRADE_NAMES: Record<string, string> = {
  '10': 'Gem Mint',
  '9': 'Mint',
  '8': 'NM-MT',
  '7': 'Near Mint',
  '6': 'EX-MT',
  '5': 'Excellent',
  '4': 'VG-EX',
  '3': 'Very Good',
  '2': 'Good',
  '1': 'Poor',
}

export const gradeName = (grade: string | null | undefined) =>
  (grade && GRADE_NAMES[grade]) || 'Graded'
