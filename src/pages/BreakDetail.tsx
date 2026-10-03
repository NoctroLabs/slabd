import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Field, TextInput } from '../components/Field'
import { useBreaks } from '../hooks/useBreaks'
import { useCards } from '../hooks/useCards'
import { supabase, cardThumbUrl } from '../lib/supabase'
import { hitsFor, perHitCost, spotProfitLoss, percent, type BreakSpot } from '../lib/breaks'
import { money, signedMoney, formatDate } from '../lib/format'

export function BreakDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { breaks, spots, loading, reload } = useBreaks()
  const { cards, loading: cardsLoading, reload: reloadCards } = useCards()

  const [editingSpot, setEditingSpot] = useState<string | 'new' | null>(null)
  const [spotName, setSpotName] = useState('')
  const [spotCost, setSpotCost] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const brk = useMemo(() => breaks.find((b) => b.id === id), [breaks, id])
  const mySpots = useMemo(
    () => spots.filter((s) => s.break_id === id).sort((a, b) => a.name.localeCompare(b.name)),
    [spots, id],
  )

  const cost = mySpots.reduce((sum, s) => sum + s.cost, 0)
  const hits = mySpots.reduce((sum, s) => sum + hitsFor(cards, s.id).length, 0)
  const profit = mySpots.reduce((sum, s) => sum + spotProfitLoss(s, cards), 0)
  const spotsHit = mySpots.filter((s) => hitsFor(cards, s.id).length > 0).length
  const hitRate = mySpots.length === 0 ? null : spotsHit / mySpots.length

  function openSpot(spot?: BreakSpot) {
    setError(null)
    if (spot) {
      setEditingSpot(spot.id)
      setSpotName(spot.name)
      setSpotCost(String(spot.cost))
    } else {
      setEditingSpot('new')
      setSpotName('')
      setSpotCost('')
    }
  }

  async function saveSpot() {
    const name = spotName.trim()
    const costValue = Number(spotCost.replace(/[^0-9.-]/g, ''))
    if (!name) {
      setError('A spot needs a name.')
      return
    }
    if (Number.isNaN(costValue)) {
      setError('That cost is not a number.')
      return
    }

    setBusy(true)
    setError(null)

    if (editingSpot === 'new') {
      const { data: auth } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('break_spots')
        .insert({ break_id: id, user_id: auth.user?.id, name, cost: costValue })
      if (error) {
        setError(error.message)
        setBusy(false)
        return
      }
    } else {
      const { error } = await supabase
        .from('break_spots')
        .update({ name, cost: costValue })
        .eq('id', editingSpot!)
      if (error) {
        setError(error.message)
        setBusy(false)
        return
      }
    }

    // The database re-splits the cost across this spot's hits on its own — see
    // the break allocation trigger — so this only has to reload.

    await Promise.all([reload(), reloadCards()])
    setEditingSpot(null)
    setBusy(false)
  }

  /** Deleting a spot leaves its cards in the collection — they just lose the
   *  allocation. Their `price_paid` is left as it was rather than zeroed,
   *  because you did pay that for them; forgetting the spot doesn't refund it. */
  async function deleteSpot(spot: BreakSpot) {
    setBusy(true)
    const { error } = await supabase.from('break_spots').delete().eq('id', spot.id)
    if (error) setError(error.message)
    await Promise.all([reload(), reloadCards()])
    setBusy(false)
  }

  async function deleteBreak() {
    setBusy(true)
    const { error } = await supabase.from('breaks').delete().eq('id', id!)
    if (error) {
      setError(error.message)
      setBusy(false)
      setConfirmDelete(false)
      return
    }
    navigate('/vault/breaks')
  }

  const working = loading || cardsLoading

  return (
    <AppShell title={brk?.name ?? 'Break'} subtitle={brk ? undefined : ' '}>
      <Link
        to="/vault/breaks"
        className="mb-6 inline-block text-[0.86rem] text-secondary transition-colors hover:text-primary"
      >
        ← All breaks
      </Link>

      {working && (
        <div className="flex justify-center py-20">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-hairline border-t-brass-bright" />
        </div>
      )}

      {!working && !brk && (
        <p className="py-16 text-center text-[0.9rem] text-tertiary">That break no longer exists.</p>
      )}

      {!working && brk && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <p className="mr-auto text-[0.88rem] text-secondary">
              {[brk.break_date && formatDate(brk.break_date), brk.seller].filter((v) => v && v.trim()).join(' · ') ||
                'No date or seller'}
            </p>
            <Link
              to={`/vault/breaks/${brk.id}/edit`}
              className="rounded-full border border-hairline px-4 py-1.5 text-[0.84rem] text-secondary transition-colors hover:text-primary"
            >
              Edit break
            </Link>
            {confirmDelete ? (
              <>
                <button
                  onClick={deleteBreak}
                  disabled={busy}
                  className="cursor-pointer rounded-full border border-loss/60 px-4 py-1.5 text-[0.84rem] text-loss transition-colors hover:bg-loss/10 disabled:opacity-50"
                >
                  Delete break and its spots
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="cursor-pointer px-2 text-[0.84rem] text-secondary hover:text-primary"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="cursor-pointer rounded-full border border-hairline px-4 py-1.5 text-[0.84rem] text-secondary transition-colors hover:border-loss/50 hover:text-loss"
              >
                Delete
              </button>
            )}
          </div>

          {confirmDelete && (
            <p className="rounded-xl border border-hairline bg-raised p-4 text-[0.84rem] text-secondary">
              The spots inside this break go with it. Any cards you pulled stay in your collection —
              they just stop showing a spot allocation.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Paid in', value: money(cost), note: `${mySpots.length} spot${mySpots.length === 1 ? '' : 's'}` },
              { label: 'Hits', value: String(hits), note: hits === 0 ? 'Nothing logged yet' : `${money(cost / hits)} a hit` },
              { label: 'Hit rate', value: hitRate == null ? '—' : percent(hitRate), note: `${spotsHit} of ${mySpots.length} spots hit` },
              { label: profit >= 0 ? 'Up' : 'Down', value: signedMoney(profit), note: 'Against what you paid' },
            ].map((t) => (
              <div key={t.label} className="rounded-2xl border border-hairline bg-surface p-5">
                <p className="text-[0.8rem] text-secondary">{t.label}</p>
                <p className="figures font-display mt-2 text-[1.5rem] leading-none font-bold text-primary">
                  {t.value}
                </p>
                <p className="mt-2 text-[0.78rem] text-tertiary">{t.note}</p>
              </div>
            ))}
          </div>

          {brk.notes && (
            <section className="rounded-2xl border border-hairline bg-surface p-6">
              <h2 className="font-display mb-3 text-[1rem] font-bold text-primary">Notes</h2>
              <p className="text-[0.9rem] leading-relaxed whitespace-pre-line text-secondary">
                {brk.notes}
              </p>
            </section>
          )}

          <section className="overflow-hidden rounded-2xl border border-hairline bg-surface">
            <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
              <h2 className="font-display text-[1.05rem] font-bold text-primary">Spots</h2>
              <button
                onClick={() => openSpot()}
                className="cursor-pointer rounded-full bg-gradient-to-b from-brass-bright to-brass px-4 py-1.5 text-[0.82rem] font-semibold text-ink transition-opacity hover:opacity-90"
              >
                Add spot
              </button>
            </div>

            {error && (
              <p className="border-b border-hairline bg-loss/10 px-6 py-3 text-[0.84rem] text-loss">
                {error}
              </p>
            )}

            {editingSpot === 'new' && (
              <SpotEditor
                name={spotName}
                cost={spotCost}
                busy={busy}
                onName={setSpotName}
                onCost={setSpotCost}
                onSave={saveSpot}
                onCancel={() => setEditingSpot(null)}
              />
            )}

            {mySpots.length === 0 && editingSpot !== 'new' && (
              <p className="px-6 py-10 text-center text-[0.88rem] text-tertiary">
                No spots yet. Add each one you paid for — the cost splits across whatever it hits.
              </p>
            )}

            <ul className="divide-y divide-hairline">
              {mySpots.map((spot) => {
                const linked = hitsFor(cards, spot.id)
                const pl = spotProfitLoss(spot, cards)
                const perHit = perHitCost(spot, linked.length)

                if (editingSpot === spot.id) {
                  return (
                    <li key={spot.id}>
                      <SpotEditor
                        name={spotName}
                        cost={spotCost}
                        busy={busy}
                        onName={setSpotName}
                        onCost={setSpotCost}
                        onSave={saveSpot}
                        onCancel={() => setEditingSpot(null)}
                      />
                    </li>
                  )
                }

                return (
                  <li key={spot.id} className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.92rem] font-medium text-primary">
                          {spot.name}
                        </p>
                        <p className="mt-0.5 text-[0.78rem] text-tertiary">
                          {money(spot.cost)}
                          {linked.length > 0 ? (
                            <>
                              {' · '}
                              {linked.length} hit{linked.length === 1 ? '' : 's'} at{' '}
                              {money(perHit)} each
                            </>
                          ) : (
                            ' · no hits'
                          )}
                        </p>
                      </div>
                      <p
                        className={`figures shrink-0 text-[0.88rem] ${pl >= 0 ? 'text-gain' : 'text-loss'}`}
                      >
                        {signedMoney(pl)}
                      </p>
                      <button
                        onClick={() => openSpot(spot)}
                        className="shrink-0 cursor-pointer text-[0.8rem] text-secondary transition-colors hover:text-primary"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteSpot(spot)}
                        disabled={busy}
                        className="shrink-0 cursor-pointer text-[0.8rem] text-secondary transition-colors hover:text-loss disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>

                    {linked.length > 0 && (
                      <ul className="mt-3 space-y-2 border-l border-hairline pl-4">
                        {linked.map((c) => (
                          <li key={c.id}>
                            <Link
                              to={`/vault/cards/${c.id}`}
                              className="flex items-center gap-3 rounded-lg py-1 transition-colors hover:bg-raised/60"
                            >
                              <div className="h-9 w-7 shrink-0 overflow-hidden rounded bg-raised">
                                {cardThumbUrl(c) && (
                                  <img
                                    src={cardThumbUrl(c)!}
                                    alt=""
                                    loading="lazy"
                                    className="h-full w-full object-cover"
                                  />
                                )}
                              </div>
                              <span className="min-w-0 flex-1 truncate text-[0.84rem] text-secondary">
                                {c.player}
                                <span className="text-tertiary">
                                  {[c.year, c.set_name].filter(Boolean).length > 0 &&
                                    ` · ${[c.year, c.set_name].filter(Boolean).join(' ')}`}
                                </span>
                              </span>
                              <span className="figures shrink-0 text-[0.82rem] text-secondary">
                                {money(c.comp_value)}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>

          <p className="text-[0.8rem] text-tertiary">
            Cards are linked to a spot from the card's own form, under Acquisition.
          </p>
        </div>
      )}
    </AppShell>
  )
}

function SpotEditor({
  name,
  cost,
  busy,
  onName,
  onCost,
  onSave,
  onCancel,
}: {
  name: string
  cost: string
  busy: boolean
  onName: (v: string) => void
  onCost: (v: string) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="border-b border-hairline bg-raised/40 px-6 py-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <Field label="Spot">
          <TextInput value={name} onChange={onName} placeholder="Team or player" />
        </Field>
        <Field label="Cost">
          <TextInput value={cost} onChange={onCost} inputMode="decimal" placeholder="0.00" />
        </Field>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={busy}
          className="cursor-pointer rounded-full bg-gradient-to-b from-brass-bright to-brass px-5 py-2 text-[0.86rem] font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save spot'}
        </button>
        <button
          onClick={onCancel}
          className="cursor-pointer text-[0.86rem] text-secondary transition-colors hover:text-primary"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
