import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { PremiumPanel } from '../components/Upgrade'
import { usePlan } from '../hooks/usePlan'
import { useCards } from '../hooks/useCards'
import { supabase } from '../lib/supabase'
import { CSV_COLUMNS, encodeCSV, parseCards } from '../lib/csv'

interface Report {
  added: number
  updated: number
  skipped: number
  failed: number
  message?: string
}

export function Data() {
  const { cards, loading, reload } = useCards()
  const { allows } = usePlan()
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [report, setReport] = useState<Report | null>(null)

  function exportCSV() {
    const blob = new Blob([encodeCSV(cards)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `slabd-collection-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importCSV(file: File) {
    setBusy(true)
    setReport(null)

    let text: string
    try {
      text = await file.text()
    } catch {
      setBusy(false)
      setReport({ added: 0, updated: 0, skipped: 0, failed: 0, message: "Couldn't read that file." })
      return
    }

    const { rows, skipped } = parseCards(text)
    if (!rows.length) {
      setBusy(false)
      setReport({
        added: 0,
        updated: 0,
        skipped,
        failed: 0,
        message: 'No card rows found. The file needs a header row with a `player` column.',
      })
      return
    }

    const { data: auth } = await supabase.auth.getUser()
    const userId = auth.user?.id
    const existing = new Set(cards.map((c) => c.id))

    let added = 0
    let updated = 0
    let failed = 0

    for (const row of rows) {
      // An id that isn't already in your collection is treated as a new card
      // rather than an update: it may well be another user's id, and row-level
      // security would reject the write anyway.
      if (row.id && existing.has(row.id)) {
        const { error } = await supabase.from('cards').update(row.values).eq('id', row.id)
        if (error) failed++
        else updated++
      } else {
        const { error } = await supabase.from('cards').insert({ ...row.values, user_id: userId })
        if (error) failed++
        else added++
      }
    }

    await reload()
    setBusy(false)
    setReport({ added, updated, skipped, failed })
  }

  return (
    <AppShell title="Import and export" subtitle="Move your collection in and out as a CSV file.">
      <Link
        to="/vault/cards"
        className="mb-6 inline-block text-[0.86rem] text-secondary transition-colors hover:text-primary"
      >
        ← All cards
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-hairline bg-surface p-6">
          <h2 className="font-display text-[1.05rem] font-bold text-primary">Export</h2>
          <p className="mt-2 text-[0.88rem] text-secondary">
            Downloads every card as a spreadsheet, in the same column order the iPhone app uses, so
            the file opens on either side.
          </p>
          <button
            onClick={exportCSV}
            disabled={loading || !cards.length}
            className="mt-5 cursor-pointer rounded-full bg-gradient-to-b from-brass-bright to-brass px-5 py-2.5 text-[0.88rem] font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Loading…' : `Download ${cards.length} card${cards.length === 1 ? '' : 's'}`}
          </button>
        </section>

        {allows('csvImport') ? (
          <section className="rounded-2xl border border-hairline bg-surface p-6">
            <h2 className="font-display text-[1.05rem] font-bold text-primary">Import</h2>
            <p className="mt-2 text-[0.88rem] text-secondary">
              A row whose id matches a card you own updates that card in place. Everything else is
              added as a new card. Columns missing from the file are left untouched.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) importCSV(f)
                e.target.value = ''
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="mt-5 cursor-pointer rounded-full border border-hairline px-5 py-2.5 text-[0.88rem] text-primary transition-colors hover:border-brass/60 disabled:opacity-50"
            >
              {busy ? 'Importing…' : 'Choose a CSV file'}
            </button>

            {report && (
              <div className="mt-5 rounded-xl border border-hairline bg-raised p-4 text-[0.86rem]">
                {report.message ? (
                  <p className="text-secondary">{report.message}</p>
                ) : (
                  <ul className="space-y-1 text-secondary">
                    <li>
                      <span className="figures text-primary">{report.added}</span> added
                    </li>
                    <li>
                      <span className="figures text-primary">{report.updated}</span> updated
                    </li>
                    {report.skipped > 0 && (
                      <li>
                        <span className="figures text-primary">{report.skipped}</span> skipped, with no
                        player name
                      </li>
                    )}
                    {report.failed > 0 && (
                      <li className="text-loss">
                        <span className="figures">{report.failed}</span> failed to save
                      </li>
                    )}
                  </ul>
                )}
              </div>
            )}
          </section>
        ) : (
          <PremiumPanel feature="csvImport" />
        )}
      </div>

      <section className="mt-6 rounded-2xl border border-hairline bg-surface p-6">
        <h2 className="font-display text-[1.05rem] font-bold text-primary">Columns</h2>
        <p className="mt-2 text-[0.88rem] text-secondary">
          Both sides match columns by header name, so the order in your file doesn't matter and extra
          columns are ignored. The Slabd serial is exported for reference but never imported, because
          the database owns it.
        </p>
        <p className="mt-3 text-[0.88rem] text-secondary">
          <strong className="text-primary">Dates in the file are ISO — 2026-08-18</strong>, even
          though the app shows them as 18/08/2026. That's deliberate:{' '}
          <span className="figures">05/09/2026</span> and{' '}
          <span className="figures">09/05/2026</span> are indistinguishable to a spreadsheet, which
          reads them by its own regional settings and can silently change the day and month round.
          ISO can only mean one thing. If you do edit a date by hand, either format is accepted on
          import.
        </p>
        <div className="mt-4 overflow-x-auto">
          <code className="font-mono text-[0.76rem] whitespace-nowrap text-tertiary">
            {CSV_COLUMNS.join(', ')}
          </code>
        </div>
      </section>
    </AppShell>
  )
}
