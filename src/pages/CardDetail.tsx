import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Slab } from '../components/Slab'
import { useCard } from '../hooks/useCard'
import { supabase, toSlabCard } from '../lib/supabase'
import { money, profitLoss, formatDate } from '../lib/format'
import { gradeName } from '../lib/types'

function Rows({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <section className="rounded-2xl border border-hairline bg-surface p-6">
      <h2 className="font-display mb-4 text-[1rem] font-bold text-primary">{title}</h2>
      <dl className="space-y-2.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4">
            <dt className="shrink-0 text-[0.84rem] text-secondary">{k}</dt>
            <dd className="figures text-right text-[0.88rem] text-primary">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function CardDetail() {
  const { id } = useParams()
  const { card, loading, error } = useCard(id)
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)
  const [confirm, setConfirm] = useState(false)

  async function remove() {
    if (!card) return
    setDeleting(true)
    const { error } = await supabase.from('cards').delete().eq('id', card.id)
    if (error) {
      setDeleting(false)
      setConfirm(false)
      return
    }
    navigate('/vault/cards')
  }

  return (
    <AppShell title={card?.player ?? 'Card'} subtitle={card ? undefined : ' '}>
      <Link
        to="/vault/cards"
        className="mb-6 inline-block text-[0.86rem] text-secondary transition-colors hover:text-primary"
      >
        ← All cards
      </Link>

      {loading && (
        <div className="flex justify-center py-20">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-hairline border-t-brass-bright" />
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-loss/40 bg-loss/10 p-4 text-[0.88rem] text-loss">
          {error}
        </p>
      )}

      {!loading && !error && !card && (
        <p className="py-16 text-center text-[0.9rem] text-tertiary">That card no longer exists.</p>
      )}

      {card && (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
          <div>
            <Slab card={toSlabCard(card)} />
            <div className="mt-4 flex items-center justify-between px-1 text-[0.74rem] text-tertiary">
              <span className="figures font-mono">
                {card.unique_serial ? `Slabd serial ${card.unique_serial}` : 'Serial pending'}
              </span>
              {card.unique_serial && (
                <a
                  href={`/?s=${card.unique_serial}`}
                  target="_blank"
                  rel="noopener"
                  className="text-brass-bright transition-opacity hover:opacity-80"
                >
                  Public page ↗
                </a>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <Link
                to={`/vault/cards/${card.id}/edit`}
                className="rounded-full bg-gradient-to-b from-brass-bright to-brass px-5 py-2.5 text-[0.88rem] font-semibold text-ink transition-opacity hover:opacity-90"
              >
                Edit card
              </Link>
              {confirm ? (
                <>
                  <button
                    onClick={remove}
                    disabled={deleting}
                    className="cursor-pointer rounded-full border border-loss/60 px-5 py-2.5 text-[0.88rem] text-loss transition-colors hover:bg-loss/10 disabled:opacity-50"
                  >
                    {deleting ? 'Deleting…' : 'Confirm delete'}
                  </button>
                  <button
                    onClick={() => setConfirm(false)}
                    className="cursor-pointer px-2 text-[0.88rem] text-secondary hover:text-primary"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirm(true)}
                  className="cursor-pointer rounded-full border border-hairline px-5 py-2.5 text-[0.88rem] text-secondary transition-colors hover:border-loss/50 hover:text-loss"
                >
                  Delete
                </button>
              )}
            </div>

            <Rows
              title="Card"
              rows={[
                ['Category', card.category],
                ['Year', card.year || '—'],
                ['Set', card.set_name || '—'],
                ['Type', card.auto_type || '—'],
                [
                  'Serial',
                  card.serial_num
                    ? `${card.serial_num}/${card.serial_total || '?'}`
                    : card.serial_kind || '—',
                ],
                ['Grade', card.grade ? `${card.grade} · ${gradeName(card.grade)}` : 'Ungraded'],
              ]}
            />

            <Rows
              title="Acquisition"
              rows={[
                ['Source', card.source || '—'],
                ['Bought from', card.seller || '—'],
                ['Date acquired', formatDate(card.date_acquired)],
                ['Price paid', money(card.price_paid)],
              ]}
            />

            <Rows
              title="Value"
              rows={[
                ['Comp value', money(card.comp_value)],
                ['Comp notes', card.comp_notes || '—'],
                ['Status', card.status],
                ...(card.status === 'Sold'
                  ? ([
                      ['Sold price', money(card.sold_price)],
                      ['Sold date', formatDate(card.sold_date)],
                    ] as [string, string][])
                  : []),
                // Null means the card has no valuation yet, which is not the
                // same as breaking even.
                (() => {
                  const pl = profitLoss(card)
                  if (pl == null) return ['Up or down', 'Not valued yet'] as [string, string]
                  return [
                    pl >= 0 ? 'Up on cost' : 'Down on cost',
                    `${pl >= 0 ? '+' : '−'}${money(Math.abs(pl))}`,
                  ] as [string, string]
                })(),
              ]}
            />

            {card.notes && <Rows title="Notes" rows={[['', card.notes]]} />}
          </div>
        </div>
      )}
    </AppShell>
  )
}
