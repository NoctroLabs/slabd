import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { useWax } from '../hooks/useWax'
import { useCards } from '../hooks/useCards'
import { supabase } from '../lib/supabase'
import { cardsFromWax, costPerCard } from '../lib/wax'
import { isSealed, premiumOverMSRP, sealedProfit } from '../lib/types'
import { money, signedMoney, formatDate } from '../lib/format'

export function WaxDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { wax, loading, reload } = useWax()
  const { cards, loading: cardsLoading, reload: reloadCards } = useCards()
  const [working, setWorking] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const box = wax.find((w) => w.id === id)
  const busy = loading || cardsLoading

  if (busy) {
    return (
      <AppShell title="Wax">
        <div className="flex justify-center py-20">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-hairline border-t-brass-bright" />
        </div>
      </AppShell>
    )
  }

  if (!box) {
    return (
      <AppShell title="Wax">
        <p className="text-[0.9rem] text-secondary">That wax is no longer in your collection.</p>
        <Link to="/vault/wax" className="mt-4 inline-block text-[0.88rem] text-brass-bright">
          Back to Sealed Openings
        </Link>
      </AppShell>
    )
  }

  const pulled = [...cardsFromWax(cards, box.id)].sort(
    (a, b) => (b.comp_value ?? 0) - (a.comp_value ?? 0),
  )
  const valuedWorth = pulled.reduce((s, c) => s + (c.comp_value ?? 0), 0)
  const unvalued = pulled.filter((c) => c.comp_value == null).length
  const share = costPerCard(box, pulled.length)
  const profit = sealedProfit(box)
  const premium = premiumOverMSRP(box)

  async function open() {
    setWorking(true)
    setError(null)
    // Clearing the value matters: once it's open there is no box to value, and
    // a stale figure would keep counting towards the collection total.
    const { error } = await supabase
      .from('wax')
      .update({ status: 'Opened', comp_value: null })
      .eq('id', box!.id)
    setWorking(false)
    setConfirmOpen(false)
    if (error) {
      setError(error.message)
      return
    }
    await reload()
    // The database has just re-split the box across its cards, so the local
    // copies are stale until they're read back.
    await reloadCards()
  }

  async function remove() {
    setWorking(true)
    const { error } = await supabase.from('wax').delete().eq('id', box!.id)
    setWorking(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate('/vault/wax')
  }

  return (
    <AppShell title={box.product} subtitle={`${box.format} · ${box.acquisition} · ${box.status}`}>
      <Link
        to="/vault/wax"
        className="mb-6 inline-block text-[0.86rem] text-secondary transition-colors hover:text-primary"
      >
        ← Sealed Openings
      </Link>

      {error && (
        <p className="mb-6 rounded-xl border border-loss/40 bg-loss/10 p-3 text-[0.86rem] text-loss">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-hairline bg-surface p-5">
          <p className="text-[0.8rem] text-secondary">Paid</p>
          <p className="figures font-display mt-2 text-[1.6rem] leading-none font-bold text-primary">
            {money(box.price_paid)}
          </p>
          {premium != null && (
            <p className="mt-2 text-[0.78rem] text-tertiary">
              {money(premium)} over retail ({money(box.msrp)})
            </p>
          )}
        </div>

        {isSealed(box) ? (
          <div className="rounded-2xl border border-hairline bg-surface p-5">
            <p className="text-[0.8rem] text-secondary">Worth now</p>
            <p className="figures font-display mt-2 text-[1.6rem] leading-none font-bold text-primary">
              {box.comp_value == null ? '—' : money(box.comp_value)}
            </p>
            <p className="mt-2 text-[0.78rem] text-tertiary">
              {profit == null ? 'No value recorded yet' : `${signedMoney(profit)} against cost`}
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-hairline bg-surface p-5">
              <p className="text-[0.8rem] text-secondary">Cards logged</p>
              <p className="figures font-display mt-2 text-[1.6rem] leading-none font-bold text-primary">
                {pulled.length}
              </p>
              {share != null && (
                <p className="mt-2 text-[0.78rem] text-tertiary">{money(share)} each</p>
              )}
            </div>
            <div className="rounded-2xl border border-hairline bg-surface p-5">
              <p className="text-[0.8rem] text-secondary">Pulled</p>
              <p className="figures font-display mt-2 text-[1.6rem] leading-none font-bold text-primary">
                {money(valuedWorth)}
              </p>
              <p className="mt-2 text-[0.78rem] text-tertiary">
                {unvalued > 0
                  ? `${unvalued} ${unvalued === 1 ? 'card has' : 'cards have'} no value yet — a floor, not a verdict`
                  : `${signedMoney(valuedWorth - (box.price_paid ?? 0))} against the box`}
              </p>
            </div>
          </>
        )}
      </div>

      {(box.seller || box.purchase_date) && (
        <p className="mt-5 text-[0.86rem] text-secondary">
          {[box.seller, box.purchase_date ? formatDate(box.purchase_date) : null]
            .filter(Boolean)
            .join(' · ')}
        </p>
      )}

      {!isSealed(box) && pulled.length > 0 && (
        // Said out loud, because nobody expects logging one more card to
        // change the cost of the cards already logged.
        <p className="mt-5 text-[0.84rem] text-tertiary">
          {money(box.price_paid)} split across {pulled.length}{' '}
          {pulled.length === 1 ? 'card' : 'cards'} — {money(share)} each. Logging another card
          re-splits it.
        </p>
      )}

      {isSealed(box) && (
        <div className="mt-8 rounded-2xl border border-brass/30 bg-surface p-6">
          <h2 className="font-display text-[1.05rem] font-bold text-primary">Open this box</h2>
          <p className="mt-2 max-w-xl text-[0.88rem] text-secondary">
            Its sealed value stops counting towards your collection, and what you paid starts
            spreading across the cards you log from it. You can't put it back.
          </p>
          {confirmOpen ? (
            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={open}
                disabled={working}
                className="cursor-pointer rounded-full bg-gradient-to-b from-brass-bright to-brass px-5 py-2.5 text-[0.88rem] font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {working ? 'Opening…' : 'Yes, open it'}
              </button>
              <button
                onClick={() => setConfirmOpen(false)}
                className="cursor-pointer text-[0.88rem] text-secondary transition-colors hover:text-primary"
              >
                Not yet
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmOpen(true)}
              className="mt-5 cursor-pointer rounded-full bg-gradient-to-b from-brass-bright to-brass px-5 py-2.5 text-[0.88rem] font-semibold text-ink transition-opacity hover:opacity-90"
            >
              Open this box
            </button>
          )}
        </div>
      )}

      {!isSealed(box) && (
        <section className="mt-8">
          <h2 className="font-display mb-3 text-[0.72rem] font-bold tracking-[0.18em] text-brass uppercase">
            Cards from this box
          </h2>
          {pulled.length === 0 ? (
            <p className="rounded-2xl border border-hairline bg-surface p-6 text-[0.88rem] text-secondary">
              Nothing logged yet. Add a card, set its source to Opened Wax and pick this box, and
              its cost will come from here.
            </p>
          ) : (
            <ul className="divide-y divide-hairline overflow-hidden rounded-2xl border border-hairline bg-surface">
              {pulled.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/vault/cards/${c.id}`}
                    className="flex items-center gap-4 p-4 transition-colors hover:bg-raised/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.95rem] font-medium text-primary">{c.player}</p>
                      <p className="mt-0.5 truncate text-[0.8rem] text-secondary">
                        {[c.year, c.set_name, c.auto_type].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {c.comp_value == null ? (
                        <p className="text-[0.78rem] text-tertiary">Not valued</p>
                      ) : (
                        <p className="figures text-[0.92rem] text-primary">{money(c.comp_value)}</p>
                      )}
                      <p className="text-[0.74rem] text-tertiary">cost {money(c.price_paid)}</p>
                    </div>
                    <span className="w-2 shrink-0 text-center text-tertiary">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {box.notes && (
        <section className="mt-8">
          <h2 className="font-display mb-2 text-[0.72rem] font-bold tracking-[0.18em] text-brass uppercase">
            Notes
          </h2>
          <p className="text-[0.88rem] whitespace-pre-line text-secondary">{box.notes}</p>
        </section>
      )}

      <div className="mt-10 flex items-center gap-4">
        <Link
          to={`/vault/wax/${box.id}/edit`}
          className="rounded-full border border-hairline px-5 py-2.5 text-[0.88rem] text-primary transition-colors hover:border-brass/60"
        >
          Edit
        </Link>
        {confirmDelete ? (
          <>
            <button
              onClick={remove}
              disabled={working}
              className="cursor-pointer rounded-full border border-loss/50 px-5 py-2.5 text-[0.88rem] text-loss transition-colors hover:bg-loss/10 disabled:opacity-50"
            >
              {working ? 'Deleting…' : 'Delete for good'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="cursor-pointer text-[0.88rem] text-secondary transition-colors hover:text-primary"
            >
              Keep it
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="cursor-pointer text-[0.88rem] text-tertiary transition-colors hover:text-loss"
          >
            Delete
          </button>
        )}
      </div>
      {confirmDelete && (
        <p className="mt-3 text-[0.82rem] text-tertiary">
          The cards you logged from it stay in your collection and keep the cost they were given.
        </p>
      )}
    </AppShell>
  )
}
