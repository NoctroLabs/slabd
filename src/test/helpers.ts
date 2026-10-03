import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Card } from '../lib/types'
import type { WantItem } from '../lib/wants'

/** Loads one of the cross-platform fixture files from `shared/fixtures`.
 *
 *  Read off disk rather than imported so the Swift tests can decode the exact
 *  same bytes. A rule that lives in one file cannot drift; a rule copied into
 *  two test suites can. */
export function fixture<T>(name: string): T {
  const path = fileURLToPath(new URL(`../../shared/fixtures/${name}`, import.meta.url))
  return JSON.parse(readFileSync(path, 'utf-8')) as T
}

/** A card with every column filled in with something harmless, so a test
 *  states only the fields it is actually about and reads as its own intent. */
export function card(overrides: Partial<Card> = {}): Card {
  return {
    id: 'card-1',
    user_id: 'user-1',
    category: 'Football',
    player: 'A Player',
    year: null,
    set_name: null,
    auto_type: null,
    serial_num: null,
    serial_total: null,
    serial_kind: 'Base',
    source: null,
    seller: null,
    price_paid: null,
    date_acquired: null,
    comp_value: null,
    comp_notes: null,
    status: 'Kept',
    sold_price: null,
    sold_date: null,
    notes: null,
    image_path: null,
    thumb_path: null,
    grade: null,
    unique_serial: null,
    break_spot_id: null,
    wax_id: null,
    ...overrides,
  }
}

export function want(overrides: Partial<WantItem> = {}): WantItem {
  return {
    id: 'want-1',
    user_id: 'user-1',
    category: 'Football',
    player: 'A Player',
    year: null,
    set_name: null,
    auto_type: null,
    serial_wanted: null,
    max_price: null,
    priority: 'Medium',
    seen_at: null,
    date_added: null,
    notes: null,
    last_checked_price: null,
    last_checked_at: null,
    ...overrides,
  }
}
