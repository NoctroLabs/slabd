import { describe, expect, it } from 'vitest'
import { CSV_COLUMNS, encodeCSV, normalizeDate, parseCSV, parseCards } from './csv'
import { card, fixture } from '../test/helpers'

interface DateFixture {
  cases: { input: string; expect: string; why: string }[]
}
interface ColumnFixture {
  columns: string[]
  export_only: string[]
}

describe('normalizeDate, against the shared fixture', () => {
  // The iOS importer runs this same table. If either side changes how it
  // reads a date, the fixture changes and the other side goes red.
  for (const c of fixture<DateFixture>('dates.json').cases) {
    it(`${JSON.stringify(c.input)} -> ${JSON.stringify(c.expect)} (${c.why})`, () => {
      expect(normalizeDate(c.input)).toBe(c.expect)
    })
  }
})

describe('CSV_COLUMNS', () => {
  it('matches the shared column contract exactly, in order', () => {
    expect([...CSV_COLUMNS]).toEqual(fixture<ColumnFixture>('csv-columns.json').columns)
  })
})

describe('parseCSV', () => {
  it('keeps a comma inside a quoted field', () => {
    expect(parseCSV('a,"b,c",d')).toEqual([['a', 'b,c', 'd']])
  })

  it('unescapes a doubled quote', () => {
    expect(parseCSV('a,"say ""hi""",b')).toEqual([['a', 'say "hi"', 'b']])
  })

  it('keeps a newline inside a quoted field', () => {
    expect(parseCSV('a,"line one\nline two",b')).toEqual([['a', 'line one\nline two', 'b']])
  })

  it('reads CRLF rows, which is what both encoders write', () => {
    expect(parseCSV('a,b\r\nc,d')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ])
  })

  it('strips the BOM Excel adds, so the first header still matches', () => {
    expect(parseCSV('﻿player,year')).toEqual([['player', 'year']])
  })

  it('drops rows that are entirely empty', () => {
    expect(parseCSV('a,b\r\n,\r\nc,d')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ])
  })
})

describe('parseCards', () => {
  it('skips a row with no player, because that is not a card', () => {
    const { rows, skipped } = parseCards('player,year\r\n,2026\r\nMbappe,2026')
    expect(skipped).toBe(1)
    expect(rows).toHaveLength(1)
    expect(rows[0].values.player).toBe('Mbappe')
  })

  it('only writes columns the file actually has', () => {
    // The guard that matters most: a file exported from the app has no
    // `grade` column. If a missing column were treated as an empty value,
    // importing would wipe the grade off every graded card.
    const { rows } = parseCards('player,year\r\nMbappe,2026')
    expect(Object.keys(rows[0].values)).toEqual(['player', 'year'])
    expect('grade' in rows[0].values).toBe(false)
  })

  it('turns an empty cell into null rather than an empty string', () => {
    const { rows } = parseCards('player,set_name\r\nMbappe,')
    expect(rows[0].values.set_name).toBeNull()
  })

  it('coerces the money columns to numbers', () => {
    const { rows } = parseCards('player,price_paid,comp_value,sold_price\r\nMbappe,10.50,25,0')
    expect(rows[0].values.price_paid).toBe(10.5)
    expect(rows[0].values.comp_value).toBe(25)
    // A legitimate zero survives. `Number(v) || null` used to turn it into
    // null, so a card acquired for nothing imported with no price at all —
    // and the app kept the zero, so the same file built two different
    // collections depending which side opened it.
    expect(rows[0].values.sold_price).toBe(0)
  })

  it('normalises a spreadsheet-mangled date on the way in', () => {
    const { rows } = parseCards('player,date_acquired\r\nMbappe,14/08/2026')
    expect(rows[0].values.date_acquired).toBe('2026-08-14')
  })

  it('keeps a well-formed id so the row updates in place', () => {
    const id = '3f8b1c22-9d4e-4a77-8b21-5c6d7e8f9a0b'
    const { rows } = parseCards(`id,player\r\n${id},Mbappe`)
    expect(rows[0].id).toBe(id)
  })

  it('discards an id that is not a uuid, so a junk value cannot target a row', () => {
    const { rows } = parseCards('id,player\r\nnot-an-id,Mbappe')
    expect(rows[0].id).toBeNull()
  })

  it('never imports the database-owned columns', () => {
    const { export_only } = fixture<ColumnFixture>('csv-columns.json')
    const { rows } = parseCards('id,unique_serial,player\r\nx,1000000001,Mbappe')
    for (const col of export_only) expect(col in rows[0].values).toBe(false)
  })

  it('reports no rows for a file with no header it recognises', () => {
    expect(parseCards('nonsense\r\nvalues').rows).toHaveLength(0)
  })
})

describe('encodeCSV', () => {
  it('writes the header in the contract order', () => {
    expect(encodeCSV([]).split('\r\n')[0]).toBe(CSV_COLUMNS.join(','))
  })

  it('separates rows with CRLF, matching the app encoder', () => {
    const out = encodeCSV([card({ player: 'One' }), card({ player: 'Two' })])
    expect(out.split('\r\n')).toHaveLength(3)
  })

  it('quotes a value containing a comma, quote or newline', () => {
    const out = encodeCSV([card({ player: 'Last, First', notes: 'a "quote"' })])
    expect(out).toContain('"Last, First"')
    expect(out).toContain('"a ""quote"""')
  })

  it('writes an empty cell for null rather than the word null', () => {
    const out = encodeCSV([card({ year: null })]).split('\r\n')[1]
    expect(out).not.toContain('null')
  })

  it('round-trips through the parser without losing an awkward value', () => {
    const encoded = encodeCSV([card({ player: 'Last, First', notes: 'line one\nline two' })])
    const { rows } = parseCards(encoded)
    expect(rows[0].values.player).toBe('Last, First')
    expect(rows[0].values.notes).toBe('line one\nline two')
  })
})
