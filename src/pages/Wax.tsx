import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { PremiumPanel } from '../components/Upgrade'
import { usePlan } from '../hooks/usePlan'
import { useWax } from '../hooks/useWax'
import { useCards } from '../hooks/useCards'
import { deriveWaxStats, cardsFromWax } from '../lib/wax'
import { isSealed, premiumOverMSRP, sealedProfit, type Wax as WaxBox } from '../lib/types'
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

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-hairline px-1.5 py-0.5 text-[0.7rem] text-secondary">
      {children}
    </span>
  )
}

function BoxRow({ box, pulled }: { box: WaxBox; pulled: number }) {
  const profit = sealedProfit(box)
  const premium = premiumOverMSRP(box)

  return (
    <Link
      to={`/vault/wax/${box.id}`}
      className="flex items-start gap-4 p-4 transition-colors hover:bg-raised/60"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.95rem] font-medium text-primary">{box.product}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Chip>{box.format}</Chip>
          {/* Retail versus secondary is the difference between a £25 blaster
              and the same blaster at £70 later, so it earns a place on the
              row rather than being buried in the detail page. */}
          <Chip>{box.acquisition}</Chip>
          {!isSealed(box) && <Chip>{pulled} {pulled === 1 ? 'card' : 'cards'}</Chip>}
        </div>
        {(box.seller || box.purchase_date) && (
          <p className="mt-1.5 truncate text-[0.78rem] text-tertiary">
            {[box.seller, box.purchase_date ? formatDate(box.purchase_date) : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
      </div>

      <div className="shrink-0 text-right">
        <p className="figures text-[0.92rem] text-primary">{money(box.price_paid)}</p>
        {isSealed(box) ? (
          profit == null ? (
            <p className="text-[0.74rem] text-tertiary">Not valued</p>
          ) : (
            <p className={`figures text-[0.8rem] ${profit >= 0 ? 'text-gain' : 'text-loss'}`}>
              {signedMoney(profit)}
            </p>
          )
        ) : pulled === 0 ? (
          <p className="text-[0.74rem] text-tertiary">No cards yet</p>
        ) : null}
        {premium != null && (
          <p className="text-[0.72rem] text-tertiary">{money(premium)} over retail</p>
        )}
      </div>
      <span className="w-2 shrink-0 text-center text-tertiary">›</span>
    </Link>
  )
}

export function Wax() {
  const { allows } = usePlan()
  const { wax, loading, error } = useWax()
  const { cards, loading: cardsLoading } = useCards()
  const s = deriveWaxStats(wax, cards)
  const busy = loading || cardsLoading

  const sealed = wax.filter(isSealed)
  const opened = wax.filter((w) => !isSealed(w))

  const title = 'Sealed Openings'
  const subtitle = 'Boxes you bought, and what came out of them.'

  // The page is replaced wholesale rather than having its buttons disabled:
  // a screen full of dead controls explains nothing.
  if (!allows('wax')) {
    return (
      <AppShell title={title} subtitle={subtitle}>
        <PremiumPanel feature="wax" />
      </AppShell>
    )
  }

  return (
    <AppShell title={title} subtitle={subtitle}>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="flex-1" />
        <Link
          to="/vault/wax/new"
          className="rounded-full bg-gradient-to-b from-brass-bright to-brass px-4 py-1.5 text-[0.84rem] font-semibold text-ink transition-opacity hover:opacity-90"
        >
          Add wax
        </Link>
      </div>

      {busy && (
        <div className="flex justify-center py-20">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-hairline border-t-brass-bright" />
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-loss/40 bg-loss/10 p-4 text-[0.88rem] text-loss">
          Couldn't load your wax: {error}
        </p>
      )}

      {!busy && !error && wax.length === 0 && (
        <div className="rounded-2xl border border-hairline bg-surface p-8 text-center">
          <p className="font-display text-[1.05rem] font-bold text-primary">No wax logged</p>
          <p className="mx-auto mt-2 max-w-md text-[0.88rem] text-secondary">
            Add a box you've bought. Keep it sealed to track what it's worth, or open it and what
            you paid spreads across the cards you log from it.
          </p>
          <Link
            to="/vault/wax/new"
            className="mt-5 inline-block rounded-full bg-gradient-to-b from-brass-bright to-brass px-5 py-2.5 text-[0.88rem] font-semibold text-ink transition-opacity hover:opacity-90"
          >
            Add wax
          </Link>
        </div>
      )}

      {!busy && !error && wax.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {s.sealedCount > 0 && (
              <>
                <Stat
                  label="Sealed"
                  value={`${s.sealedCount}`}
                  note={`${money(s.sealedSpend)} tied up`}
                />
                <Stat
                  label="Sealed value"
                  value={money(s.sealedValue)}
                  note={
                    s.unvaluedSealed > 0
                      ? `${s.unvaluedSealed} not valued, so not counted`
                      : signedMoney(s.sealedPL) + ' against cost'
                  }
                />
              </>
            )}
            {s.openedCount > 0 && (
              <>
                <Stat
                  label="Opened spend"
                  value={money(s.openedSpend)}
                  note={`${s.openedCount} ${s.openedCount === 1 ? 'box' : 'boxes'}`}
                />
                <Stat
                  label="Pulled vs paid"
                  value={signedMoney(s.openedPL)}
                  // Without this the figure reads as a verdict when it's a
                  // floor — a box whose hits aren't priced yet looks like a
                  // loss because nothing has been counted.
                  note={
                    s.unvaluedPulls > 0
                      ? `${s.unvaluedPulls} pulled ${s.unvaluedPulls === 1 ? 'card has' : 'cards have'} no value yet — this is a floor`
                      : `${money(s.pulledValue)} of cards`
                  }
                />
              </>
            )}
          </div>

          {sealed.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display mb-3 text-[0.72rem] font-bold tracking-[0.18em] text-brass uppercase">
                Sealed
              </h2>
              <ul className="divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-surface">
                {sealed.map((box) => (
                  <li key={box.id}>
                    <BoxRow box={box} pulled={cardsFromWax(cards, box.id).length} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {opened.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display mb-3 text-[0.72rem] font-bold tracking-[0.18em] text-brass uppercase">
                Opened
              </h2>
              <ul className="divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-surface">
                {opened.map((box) => (
                  <li key={box.id}>
                    <BoxRow box={box} pulled={cardsFromWax(cards, box.id).length} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </AppShell>
  )
}
