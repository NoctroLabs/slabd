import type { Card } from './types'

/** Column order matching `Card.csvColumns` in the iOS app, so a file exported
 *  from either side imports cleanly into the other.
 *
 *  `grade` is appended beyond the app's list: it postdates that code, and both
 *  importers key off the header rather than position, so an extra column is
 *  ignored rather than misread. `unique_serial` is exported for reference but
 *  never imported — it's database-assigned and unique-constrained, so writing
 *  it back would either collide or hand one card another's identity. */
export const CSV_COLUMNS = [
  'id',
  'player',
  'category',
  'year',
  'set_name',
  'auto_type',
  'serial_num',
  'serial_total',
  'serial_kind',
  'source',
  'seller',
  'price_paid',
  'date_acquired',
  'comp_value',
  'comp_notes',
  'status',
  'sold_price',
  'sold_date',
  'notes',
  'grade',
  'unique_serial',
] as const

/** Columns a row may write. Excludes the two the database owns. */
const IMPORTABLE = CSV_COLUMNS.filter((c) => c !== 'id' && c !== 'unique_serial')

const NUMERIC = new Set(['price_paid', 'comp_value', 'sold_price'])
const DATES = new Set(['date_acquired', 'sold_date'])

/** Normalises a date field to the ISO form the database column expects.
 *
 *  Spreadsheet apps re-save a date-shaped column in the machine's local
 *  style the moment the file is opened and saved again, even untouched. UK
 *  `14/08/2026` is then either rejected outright by Postgres or, worse,
 *  silently misread as a month when the day is 12 or under. The iOS
 *  importer already guards against this; the web importer has to agree, or
 *  the same file behaves differently depending which one opened it.
 *
 *  An unrecognised value is passed through rather than dropped, so the
 *  database rejects it visibly instead of the row losing a date quietly. */
export function normalizeDate(raw: string): string {
  const v = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v

  const m = v.match(/^(\d{1,4})[/.-](\d{1,2})[/.-](\d{2,4})$/)
  if (!m) return v

  const pad = (n: string) => n.padStart(2, '0')
  // yyyy/MM/dd
  if (m[1].length === 4) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`

  const a = Number(m[1])
  const b = Number(m[2])
  const year = m[3].length === 2 ? `20${m[3]}` : m[3]
  // Day-first unless the first number can only be a month, matching the
  // app's preference order (dd/MM before MM/dd).
  const [day, month] = a > 12 && b <= 12 ? [a, b] : b > 12 ? [b, a] : [a, b]
  if (day < 1 || day > 31 || month < 1 || month > 12) return v
  return `${year}-${pad(String(month))}-${pad(String(day))}`
}

/** Parses a money cell.
 *
 *  `Number(v) || null` was wrong here: `Number('0')` is `0`, which is falsy,
 *  so a card genuinely acquired for nothing — a giveaway, a freebie in a
 *  trade — imported with no price at all. The app's `Double.init` kept the
 *  zero, so the same file produced different collections depending which side
 *  opened it, and a zero cost is not the same as an unknown one: it counts
 *  towards total spend and towards profit. */
function parseMoney(raw: string): number | null {
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

/** Columns whose values are a fixed set, with the values themselves. Casing
 *  is corrected on import: a hand-typed `sold` clearly means `Sold`, the
 *  database now refuses anything else on `status`, and the old behaviour was
 *  to store it and then compute profit from the comp value instead of the
 *  sale price — wrong figures, no error. Mirrors `canonical` in the app's
 *  `CSV.swift`.
 *
 *  An unrecognised value passes through untouched, so the database rejects it
 *  visibly rather than it being reinterpreted as something unwritten. */
const CANONICAL: Record<string, string[]> = {
  status: ['Kept', 'For Sale', 'Sold'],
  serial_kind: ['Base', 'Serial', 'SSP', 'Case Hit'],
  source: ['Single Purchase', 'Break', 'Opened Wax'],
}

function canonicalise(col: string, raw: string): string {
  const options = CANONICAL[col]
  if (!options) return raw
  return options.find((o) => o.toLowerCase() === raw.toLowerCase()) ?? raw
}

const escape = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)

export function encodeCSV(cards: Card[]): string {
  const rows = [
    CSV_COLUMNS.join(','),
    ...cards.map((c) =>
      CSV_COLUMNS.map((col) => {
        const v = (c as unknown as Record<string, unknown>)[col]
        return escape(v == null ? '' : String(v))
      }).join(','),
    ),
  ]
  // CRLF, matching the app's encoder.
  return rows.join('\r\n')
}

/** RFC 4180 parse: handles quoted fields containing commas, quotes and
 *  newlines, which a naive split on ',' silently corrupts. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  let i = 0

  // Strip a UTF-8 BOM, which Excel adds and which would otherwise become
  // part of the first header name and break column matching.
  if (text.charCodeAt(0) === 0xfeff) i = 1

  for (; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\r') {
      // swallow; the \n handles the break
    } else if (ch === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += ch
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ''))
}

export interface ParsedRow {
  id: string | null
  values: Record<string, string | number | null>
}

/** Turns CSV text into per-row update payloads.
 *
 *  Only columns actually present in the header are included. That matters:
 *  a file exported from the app has no `grade` column, and if a missing
 *  column were treated as an empty value, importing it would silently wipe
 *  the grade off every graded card. */
export function parseCards(text: string): { rows: ParsedRow[]; skipped: number } {
  const raw = parseCSV(text)
  if (!raw.length) return { rows: [], skipped: 0 }

  const header = raw[0].map((h) => h.trim())
  const present = IMPORTABLE.filter((c) => header.includes(c))
  const idIndex = header.indexOf('id')

  const rows: ParsedRow[] = []
  let skipped = 0

  for (const line of raw.slice(1)) {
    const get = (col: string) => {
      const idx = header.indexOf(col)
      return idx >= 0 && idx < line.length ? line[idx].trim() : ''
    }

    // A row with no player is not a card. The app applies the same rule.
    if (!get('player')) {
      skipped++
      continue
    }

    const values: Record<string, string | number | null> = {}
    for (const col of present) {
      const v = get(col)
      values[col] =
        v === ''
          ? null
          : NUMERIC.has(col)
            ? parseMoney(v)
            : DATES.has(col)
              ? normalizeDate(v)
              : canonicalise(col, v)
    }

    const id = idIndex >= 0 ? line[idIndex]?.trim() || null : null
    rows.push({ id: id && /^[0-9a-f-]{36}$/i.test(id) ? id : null, values })
  }

  return { rows, skipped }
}
