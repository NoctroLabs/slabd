import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { CardLimitNotice } from '../components/Upgrade'
import { usePlan } from '../hooks/usePlan'
import { useCards } from '../hooks/useCards'
import { useCategories } from '../hooks/useCategories'
import { cardThumbUrl } from '../lib/supabase'
import { money, profitLoss } from '../lib/format'
import { gradeName, type Card } from '../lib/types'
import { DEFAULT_SORT, SORTS, sortCards, type Sort } from '../lib/sort'

/** The serial designation, as a compact badge for list rows. */
function Tag({ card }: { card: { serial_kind: string | null; serial_num: string | null; serial_total: string | null; grade: string | null } }) {
  const label = card.grade
    ? `Grade ${card.grade}`
    : card.serial_kind === 'Base'
      ? 'Base'
      : card.serial_kind === 'SSP'
        ? 'SSP'
        : card.serial_kind === 'Case Hit'
          ? 'Case Hit'
          : card.serial_num
            ? `${card.serial_num}/${card.serial_total || '?'}`
            : '—'

  return (
    <span className="font-display shrink-0 rounded border border-brass/60 px-2 py-0.5 text-[0.7rem] tracking-wide text-brass-bright">
      {label}
    </span>
  )
}

/** A gallery tile: the card photo, its name over a gradient, and what it's
 *  worth.
 *
 *  Mirrors the app's gallery grid, with two deliberate differences. The app
 *  shows only cards that have a photo, because it's a swipeable browse and a
 *  photoless card has nothing to swipe to; here the gallery shares the list's
 *  search and filters, so dropping cards would mean two views of the same
 *  query disagreeing about what's in it — a placeholder is less confusing than
 *  a missing card. And the value is shown, which the app leaves off: a desktop
 *  tile has room for it, and it's the thing you scan a collection for. */
function GalleryTile({ card }: { card: Card }) {
  const thumb = cardThumbUrl(card)
  return (
    <Link
      to={`/vault/cards/${card.id}`}
      className="group relative block aspect-5/7 overflow-hidden rounded-lg border border-hairline bg-raised transition-colors hover:border-brass/60"
    >
      {thumb ? (
        <img
          src={thumb}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center px-2 text-center text-[0.72rem] text-tertiary">
          No photo
        </span>
      )}

      {/* The gradient is what makes the name readable over an arbitrary photo.
          Without it the text is legible on dark card art and invisible on a
          white-bordered one. */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-2 pt-6 pb-1.5">
        <p className="truncate text-[0.78rem] font-semibold text-white">{card.player}</p>
        <p className="figures truncate text-[0.7rem] text-white/70">{money(card.comp_value)}</p>
      </div>
    </Link>
  )
}

export function Cards() {
  const { cards, loading, error } = useCards()
  const { categories } = useCategories()
  const { plan } = usePlan()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  // Remembered per browser, the way the app remembers it per device — a
  // chosen order is a preference, not a one-off.
  const [sort, setSort] = useState<Sort>(() => {
    try {
      const saved = localStorage.getItem('slabd.sort')
      return SORTS.includes(saved as Sort) ? (saved as Sort) : DEFAULT_SORT
    } catch {
      return DEFAULT_SORT
    }
  })
  // Gallery is a view of this same list rather than a separate page, so the
  // search box, the category chips and the sort order all carry across. The
  // app has it as its own tab, but the app's list has no search bar to share.
  const [view, setView] = useState<'list' | 'gallery'>(() => {
    try {
      return localStorage.getItem('slabd.cardsView') === 'gallery' ? 'gallery' : 'list'
    } catch {
      return 'list'
    }
  })

  function chooseView(next: 'list' | 'gallery') {
    setView(next)
    try {
      localStorage.setItem('slabd.cardsView', next)
    } catch {
      // Site data blocked: the toggle still works, it just won't be
      // remembered next visit.
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = cards.filter((c) => {
      if (category !== 'All' && c.category !== category) return false
      if (!q) return true
      return [c.player, c.year, c.set_name, c.auto_type, c.seller, c.unique_serial]
        .filter(Boolean)
        .some((f) => f!.toLowerCase().includes(q))
    })
    return sortCards(matches, sort)
  }, [cards, query, category, sort])

  return (
    <AppShell
      title="My cards"
      subtitle={`${cards.length} card${cards.length === 1 ? '' : 's'} in your vault`}
      search={query}
      onSearch={setQuery}
    >
      {/* Filters sit in one row above the content. */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {['All', ...categories.map((c) => c.name)].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-[0.84rem] transition-colors ${
              category === c
                ? 'bg-gradient-to-b from-brass-bright to-brass font-medium text-ink'
                : 'border border-hairline text-secondary hover:text-primary'
            }`}
          >
            {c}
          </button>
        ))}
        <span className="flex-1" />
        {/* Segmented, not two separate buttons: which view you're in is part
            of the control's own state, so the pair has to read as one thing
            with one of them selected. */}
        <div className="flex overflow-hidden rounded-full border border-hairline">
          {(['list', 'gallery'] as const).map((option) => (
            <button
              key={option}
              onClick={() => chooseView(option)}
              aria-pressed={view === option}
              className={`cursor-pointer px-3.5 py-1.5 text-[0.84rem] capitalize transition-colors ${
                view === option
                  ? 'bg-gradient-to-b from-brass-bright to-brass font-medium text-ink'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[0.84rem] text-secondary">
          <span className="sr-only">Sort by</span>
          <select
            value={sort}
            onChange={(e) => {
              const next = e.target.value as Sort
              setSort(next)
              try {
                localStorage.setItem('slabd.sort', next)
              } catch {
                // A browser with site data blocked still sorts; it just
                // won't remember the choice next visit.
              }
            }}
            className="cursor-pointer rounded-full border border-hairline bg-surface px-4 py-1.5 text-[0.84rem] text-secondary transition-colors hover:text-primary focus:border-brass/60 focus:outline-none"
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <Link
          to="/vault/data"
          className="rounded-full border border-hairline px-4 py-1.5 text-[0.84rem] text-secondary transition-colors hover:text-primary"
        >
          Import / export
        </Link>
        <Link
          to="/vault/cards/new"
          className="rounded-full bg-gradient-to-b from-brass-bright to-brass px-4 py-1.5 text-[0.84rem] font-semibold text-ink transition-opacity hover:opacity-90"
        >
          Add card
        </Link>
      </div>

      {plan === 'free' && <CardLimitNotice count={cards.length} />}

      {loading && (
        <div className="flex justify-center py-20">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-hairline border-t-brass-bright" />
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-loss/40 bg-loss/10 p-4 text-[0.88rem] text-loss">
          Couldn't load your collection: {error}
        </p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="py-16 text-center text-[0.9rem] text-tertiary">
          {cards.length ? 'No cards match that.' : 'No cards yet. Add one to get started.'}
        </p>
      )}

      {!loading && !error && filtered.length > 0 && view === 'gallery' && (
        // Column count climbs with the viewport rather than sitting at the
        // app's three: a tile below roughly 130px wide stops showing the card
        // and starts showing a stamp, and a 27-inch screen showing three
        // columns wastes the only advantage desktop has here.
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((c) => (
            <li key={c.id}>
              <GalleryTile card={c} />
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && filtered.length > 0 && view === 'list' && (
        <>
        {/* Named once here rather than on every row — at 78 rows the repeated
            labels would swamp the list they're meant to explain. The widths,
            gap and padding below mirror the row exactly so each word sits over
            its own column. Hidden on narrow screens, where the two figures
            stack instead of sitting side by side. */}
        <div className="mb-2 hidden items-baseline gap-4 px-4 text-[0.7rem] tracking-[0.1em] text-tertiary uppercase sm:flex">
          <span className="w-12 shrink-0" aria-hidden="true" />
          <span className="flex-1" />
          {/* Cost first: the row then reads left to right as the sum it is —
              what you paid, what it's worth, the difference. Cost is the one
              that drops on narrower screens, since it's the only one you can
              derive from the other two. */}
          <span className="hidden w-24 shrink-0 text-right md:block">Cost</span>
          <span className="w-24 shrink-0 text-right">Value</span>
          <span className="w-24 shrink-0 text-right">P/L</span>
          <span className="w-2 shrink-0" aria-hidden="true" />
        </div>
        <ul className="divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-surface">
          {filtered.map((c) => {
            const pl = profitLoss(c)
            return (
              <li key={c.id}>
                <Link
                  to={`/vault/cards/${c.id}`}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-raised/60"
                >
                <div className="h-16 w-12 shrink-0 overflow-hidden rounded bg-raised">
                  {cardThumbUrl(c) && (
                    <img
                      src={cardThumbUrl(c)!}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <p className="truncate text-[0.95rem] font-medium text-primary">{c.player}</p>
                    <Tag card={c} />
                  </div>
                  <p className="mt-0.5 truncate text-[0.8rem] text-secondary">
                    {[c.year, c.set_name, c.auto_type].filter(Boolean).join(' · ')}
                  </p>
                  {c.grade && (
                    <p className="mt-0.5 text-[0.74rem] text-tertiary">{gradeName(c.grade)}</p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-0 text-right sm:flex-row sm:items-baseline sm:gap-4">
                  <p className="figures hidden w-24 shrink-0 text-[0.92rem] text-secondary md:block">
                    {money(c.price_paid)}
                  </p>
                  <p className="figures w-24 shrink-0 text-[0.92rem] text-primary">
                    {money(c.comp_value)}
                  </p>
                  {pl == null ? (
                    <p
                      className="w-24 shrink-0 text-[0.78rem] text-tertiary"
                      title="No comp value recorded yet"
                    >
                      Not valued
                    </p>
                  ) : (
                    <p
                      className={`figures w-24 shrink-0 text-[0.78rem] sm:text-[0.92rem] ${
                        pl >= 0 ? 'text-gain' : 'text-loss'
                      }`}
                      title={pl >= 0 ? 'Up on what you paid' : 'Down on what you paid'}
                    >
                      {pl >= 0 ? '+' : '−'}
                      {money(Math.abs(pl))}
                    </p>
                  )}
                </div>

                <span className="w-2 shrink-0 text-center text-tertiary">›</span>
                </Link>
              </li>
            )
          })}
        </ul>
        </>
      )}
    </AppShell>
  )
}
