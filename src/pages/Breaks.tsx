import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { PremiumPanel } from '../components/Upgrade'
import { usePlan } from '../hooks/usePlan'
import { useBreaks } from '../hooks/useBreaks'
import { useCards } from '../hooks/useCards'
import { deriveBreakStats, orderBreaks, percent } from '../lib/breaks'
import { money, signedMoney, formatDate } from '../lib/format'

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-5">
      <p className="text-[0.8rem] text-secondary">{label}</p>
      <p className="figures font-display mt-2 text-[1.6rem] leading-none font-bold text-primary">
        {value}
      </p>
      {note && <p className="mt-2 text-[0.78rem] text-tertiary">{note}</p>}
    </div>
  )
}

/** Hit rate wears a colour band, but never colour alone — the percentage is
 *  always written out beside it, so the meaning survives for a colourblind
 *  reader and in print. */
function HitRate({ rate }: { rate: number | null }) {
  if (rate == null) return <span className="text-tertiary">—</span>
  const tone = rate >= 0.5 ? 'text-gain' : rate >= 0.25 ? 'text-brass-bright' : 'text-loss'
  return <span className={`figures ${tone}`}>{percent(rate)}</span>
}

export function Breaks() {
  const { allows } = usePlan()
  const { breaks, spots, loading, error } = useBreaks()
  const { cards, loading: cardsLoading } = useCards()
  const s = deriveBreakStats(breaks, spots, cards)
  const ordered = orderBreaks(breaks)
  const busy = loading || cardsLoading

  // The page is replaced wholesale rather than having its buttons disabled:
  // a screen full of dead controls explains nothing.
  if (!allows('breaks')) {
    return (
      <AppShell title="Breaks" subtitle="What you paid into breaks, and what came out.">
        <PremiumPanel feature="breaks" />
      </AppShell>
    )
  }

  return (
    <AppShell title="Breaks" subtitle="What you paid into breaks, and what came out.">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="flex-1" />
        <Link
          to="/vault/breaks/new"
          className="rounded-full bg-gradient-to-b from-brass-bright to-brass px-4 py-1.5 text-[0.84rem] font-semibold text-ink transition-opacity hover:opacity-90"
        >
          Add break
        </Link>
      </div>

      {busy && (
        <div className="flex justify-center py-20">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-hairline border-t-brass-bright" />
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-loss/40 bg-loss/10 p-4 text-[0.88rem] text-loss">
          Couldn't load your breaks: {error}
        </p>
      )}

      {!busy && !error && breaks.length === 0 && (
        <div className="rounded-2xl border border-hairline bg-surface py-16 text-center">
          <p className="text-[0.95rem] text-secondary">No breaks yet</p>
          <p className="mx-auto mt-2 max-w-md text-[0.85rem] text-tertiary">
            Add a break, then log each spot you paid for within it, to see your hit rate and average
            cost per hit.
          </p>
          <Link
            to="/vault/breaks/new"
            className="mt-6 inline-block rounded-full bg-gradient-to-b from-brass-bright to-brass px-5 py-2 text-[0.86rem] font-semibold text-ink transition-opacity hover:opacity-90"
          >
            Add a break
          </Link>
        </div>
      )}

      {!busy && !error && breaks.length > 0 && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label="Total into breaks"
              value={money(s.totalSpend)}
              note={`${spots.length} spot${spots.length === 1 ? '' : 's'} across ${breaks.length} break${breaks.length === 1 ? '' : 's'}`}
            />
            <Stat
              label="Hits"
              value={String(s.totalHits)}
              note={s.costPerHit == null ? 'No hits logged yet' : `${money(s.costPerHit)} a hit`}
            />
            <Stat
              label="Hit rate"
              value={s.hitRate == null ? '—' : percent(s.hitRate)}
              note="Spots that hit at least once"
            />
            <Stat
              label={s.profit >= 0 ? 'Up on breaks' : 'Down on breaks'}
              value={signedMoney(s.profit)}
              note="A spot with no hits counts as a full loss"
            />
          </div>

          {s.bySeller.length > 0 && (
            <section className="rounded-2xl border border-hairline bg-surface p-6">
              <h2 className="font-display text-[1.05rem] font-bold text-primary">Buying patterns</h2>
              <p className="mt-1 text-[0.8rem] text-tertiary">
                Ranked by how often you buy from them, not by profit.
              </p>
              <ul className="mt-5 divide-y divide-hairline">
                {s.bySeller.map((row) => (
                  <li key={row.seller} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.9rem] text-primary">{row.seller}</p>
                      <p className="mt-0.5 truncate text-[0.76rem] text-tertiary">
                        {row.breakCount} break{row.breakCount === 1 ? '' : 's'} ·{' '}
                        {row.spotCount} spot{row.spotCount === 1 ? '' : 's'} · {money(row.spend)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[0.86rem]">
                        <HitRate rate={row.hitRate} />
                      </p>
                      <p
                        className={`figures text-[0.78rem] ${row.profit >= 0 ? 'text-gain' : 'text-loss'}`}
                      >
                        {signedMoney(row.profit)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="overflow-hidden rounded-2xl border border-hairline bg-surface">
            <h2 className="font-display border-b border-hairline px-6 py-4 text-[1.05rem] font-bold text-primary">
              All breaks
            </h2>
            <ul className="divide-y divide-hairline">
              {ordered.map((brk) => {
                const r = s.rollup[brk.id]
                return (
                  <li key={brk.id}>
                    <Link
                      to={`/vault/breaks/${brk.id}`}
                      className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-raised/60"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.95rem] font-medium text-primary">
                          {brk.name}
                        </p>
                        <p className="mt-0.5 truncate text-[0.8rem] text-secondary">
                          {[brk.break_date && formatDate(brk.break_date), brk.seller].filter((v) => v && v.trim()).join(' · ') ||
                            'No date or seller'}
                        </p>
                        <p className="mt-0.5 text-[0.76rem] text-tertiary">
                          {r.spotCount} spot{r.spotCount === 1 ? '' : 's'} · {r.hits} hit
                          {r.hits === 1 ? '' : 's'}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="figures text-[0.92rem] text-primary">{money(r.cost)}</p>
                        <p
                          className={`figures text-[0.78rem] ${r.profit >= 0 ? 'text-gain' : 'text-loss'}`}
                        >
                          {signedMoney(r.profit)}
                        </p>
                      </div>
                      <span className="shrink-0 text-tertiary">›</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      )}
    </AppShell>
  )
}
