import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Slab } from '../components/Slab'
import { Field, Section, Select, TextArea, TextInput, Toggle } from '../components/Field'
import { useCard } from '../hooks/useCard'
import { useCards } from '../hooks/useCards'
import { useBreaks } from '../hooks/useBreaks'
import { useWax } from '../hooks/useWax'
import { useCategories } from '../hooks/useCategories'
import { PhotoPicker } from '../components/PhotoPicker'
import { CategoryPicker } from '../components/CategoryPicker'
import { cardImageUrl, supabase } from '../lib/supabase'
import { deleteCardImage, uploadCardImage } from '../lib/images'
import { AUTO_TYPES, GRADES, SERIAL_KINDS, SOURCES, STATUSES } from '../lib/options'
import { gradeName } from '../lib/types'
import { money } from '../lib/format'

interface Draft {
  player: string
  category: string
  year: string
  set_name: string
  auto_type: string
  serial_num: string
  serial_total: string
  serial_kind: string
  break_spot_id: string
  wax_id: string
  grade: string
  source: string
  seller: string
  price_paid: string
  date_acquired: string
  comp_value: string
  comp_notes: string
  status: string
  sold_price: string
  sold_date: string
  notes: string
}

const EMPTY: Draft = {
  player: '',
  category: '',
  year: '',
  set_name: '',
  auto_type: 'Auto',
  serial_num: '',
  serial_total: '',
  serial_kind: 'Base',
  break_spot_id: '',
  wax_id: '',
  grade: '',
  source: 'Single Purchase',
  seller: '',
  price_paid: '',
  date_acquired: new Date().toISOString().slice(0, 10),
  comp_value: '',
  comp_notes: '',
  status: 'Kept',
  sold_price: '',
  sold_date: '',
  notes: '',
}

/** Digits, with an optional leading minus.
 *
 *  Printed serials aren't always positive whole numbers — some Topps Chrome
 *  parallels are numbered oddly, a Frozen Fractor numbered -3/0 among them —
 *  so the field has to accept a minus while still refusing everything else. */
const sanitizeSerial = (raw: string) => {
  const negative = raw.startsWith('-')
  const digits = raw.replace(/\D/g, '')
  return negative ? `-${digits}` : digits
}

const num = (v: string) => {
  const n = Number(v.replace(/[^0-9.-]/g, ''))
  return v.trim() === '' || Number.isNaN(n) ? null : n
}
const str = (v: string) => (v.trim() === '' ? null : v.trim())

export function CardForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const location = useLocation()
  const { card, loading } = useCard(id)
  const { cards } = useCards()
  const { breaks, spots } = useBreaks()
  const { wax } = useWax()
  // Only opened boxes can take a card: a sealed box's money is still in the
  // box, so linking a card to one would charge it a cost that hasn't been
  // released yet. The database agrees — a sealed box allocates nothing.
  const openedWax = wax
    .filter((w) => w.status !== 'Sealed')
    .sort((a, b) => a.product.localeCompare(b.product))
  const { categories } = useCategories()

  const [d, setD] = useState<Draft>(EMPTY)
  const [graded, setGraded] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoRemoved, setPhotoRemoved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sets already used, most-recently-added first, matching the app's picker
  // order so the set you're working through stays at the top.
  const knownSets = useMemo(() => {
    const seen: string[] = []
    for (const c of cards) if (c.set_name && !seen.includes(c.set_name)) seen.push(c.set_name)
    return seen
  }, [cards])

  /// What the database will set this card's price to, when its cost comes from
  /// a spot or a box rather than being typed in.
  ///
  /// The field is then shown read-only and left out of the payload entirely.
  /// Sending it would be worse than pointless: the allocation trigger only
  /// re-fires when the LINK changes, so a typed-over figure on an existing
  /// card would stick until the next card joined the pot — the collection
  /// quietly disagreeing with the split it's supposed to be showing. The app
  /// has always hidden this field; the web let you edit it.
  const allocated = useMemo<number | null>(() => {
    if (d.source === 'Break' && d.break_spot_id) {
      const spot = spots.find((sp) => sp.id === d.break_spot_id)
      if (!spot) return null
      const others = cards.filter((c) => c.break_spot_id === spot.id && c.id !== id).length
      return spot.cost / (others + 1)
    }
    if (d.source === 'Opened Wax' && d.wax_id) {
      const box = wax.find((w) => w.id === d.wax_id)
      if (!box || box.price_paid == null) return null
      const others = cards.filter((c) => c.wax_id === box.id && c.id !== id).length
      return box.price_paid / (others + 1)
    }
    return null
  }, [d.source, d.break_spot_id, d.wax_id, spots, wax, cards, id])

  useEffect(() => {
    if (!card) return
    setD({
      player: card.player ?? '',
      category: card.category ?? '',
      year: card.year ?? '',
      set_name: card.set_name ?? '',
      auto_type: card.auto_type ?? 'Auto',
      serial_num: card.serial_num ?? '',
      serial_total: card.serial_total ?? '',
      serial_kind: card.serial_kind ?? 'Base',
      break_spot_id: card.break_spot_id ?? '',
      wax_id: card.wax_id ?? '',
      grade: card.grade ?? '',
      source: card.source ?? 'Single Purchase',
      seller: card.seller ?? '',
      price_paid: card.price_paid == null ? '' : String(card.price_paid),
      date_acquired: card.date_acquired ?? '',
      comp_value: card.comp_value == null ? '' : String(card.comp_value),
      comp_notes: card.comp_notes ?? '',
      status: card.status ?? 'Kept',
      sold_price: card.sold_price == null ? '' : String(card.sold_price),
      sold_date: card.sold_date ?? '',
      notes: card.notes ?? '',
    })
    setGraded(Boolean(card.grade))
  }, [card])

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }))

  // Arriving from "Mark as bought" on the want list, with the want's details
  // already filled in. Price paid is left empty on purpose: what you hoped to
  // pay is not what you paid.
  useEffect(() => {
    const prefill = (location.state as { prefill?: Partial<Draft> } | null)?.prefill
    if (editing || !prefill) return
    setD((p) => ({ ...p, ...prefill }))
  }, [editing, location.state])

  // A new card starts on your first category rather than a hardcoded one —
  // "Football" is meaningless to somebody who collects Pokemon.
  useEffect(() => {
    if (editing || d.category || categories.length === 0) return
    setD((p) => (p.category ? p : { ...p, category: categories[0].name }))
  }, [editing, d.category, categories])

  // Spots labelled with their break, because a spot name on its own ("Man
  // Utd") says nothing about which break it belongs to.
  const spotOptions = useMemo(() => {
    const breakName = new Map(breaks.map((b) => [b.id, b.name]))
    return spots
      .map((s) => ({
        id: s.id,
        label: `${breakName.get(s.break_id) ?? 'Unknown break'} — ${s.name}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [breaks, spots])

  // Local preview of a newly chosen photo, so the slab shows the real card
  // before anything is uploaded.
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  useEffect(() => {
    if (!photo) {
      setPhotoPreview(null)
      return
    }
    const url = URL.createObjectURL(photo)
    setPhotoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  async function save() {
    if (!d.player.trim()) {
      setError('A card needs a player name.')
      return
    }
    setSaving(true)
    setError(null)

    const { data: auth } = await supabase.auth.getUser()
    const userId = auth.user?.id
    if (!userId) {
      setError('Your session has expired. Sign in again.')
      setSaving(false)
      return
    }

    // Upload the photo before writing the row, so a failed upload can't leave
    // the card pointing at a path that doesn't exist. The previous photo is
    // only deleted once the new one is safely attached — same order as the app.
    const previousPath = card?.image_path ?? null
    const previousThumb = card?.thumb_path ?? null
    let imagePath = previousPath
    let thumbPath = previousThumb
    if (photo) {
      try {
        const uploaded = await uploadCardImage(photo, userId)
        imagePath = uploaded.path
        thumbPath = uploaded.thumbPath
      } catch (e) {
        setError(`Photo didn't upload: ${e instanceof Error ? e.message : 'unknown error'}`)
        setSaving(false)
        return
      }
    } else if (photoRemoved) {
      imagePath = null
      thumbPath = null
    }

    const payload = {
      image_path: imagePath,
      thumb_path: thumbPath,
      player: d.player.trim(),
      category: d.category,
      year: str(d.year),
      set_name: str(d.set_name),
      auto_type: str(d.auto_type),
      serial_num: str(d.serial_num),
      serial_total: str(d.serial_total),
      serial_kind: d.serial_kind,
      // A card only belongs to a spot if it came from a break.
      break_spot_id: d.source === 'Break' && d.break_spot_id ? d.break_spot_id : null,
      wax_id: d.source === 'Opened Wax' && d.wax_id ? d.wax_id : null,
      // Clearing the toggle must clear the stored grade, or an ungraded card
      // keeps rendering a grade block on its slab.
      grade: graded ? str(d.grade) : null,
      source: str(d.source),
      seller: str(d.seller),
      // Omitted, not nulled, when the cost is allocated: leaving the key out
      // of an update means the column isn't touched, and on insert the
      // trigger fills it in.
      ...(allocated == null ? { price_paid: num(d.price_paid) } : {}),
      date_acquired: str(d.date_acquired),
      comp_value: num(d.comp_value),
      comp_notes: str(d.comp_notes),
      status: d.status,
      sold_price: num(d.sold_price),
      sold_date: str(d.sold_date),
      notes: str(d.notes),
    }

    // A photo that's been replaced or removed is only cleaned up after the row
    // is saved — if the write fails, the card still points at it.
    const cleanUp = async () => {
      if (previousPath && previousPath !== imagePath) {
        await deleteCardImage(previousPath, previousThumb)
      }
    }


    if (editing) {
      const { error } = await supabase.from('cards').update(payload).eq('id', id!)
      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
      await cleanUp()
      navigate(`/vault/cards/${id}`)
    } else {
      // user_id has to be set explicitly: the row-level security policy checks
      // it, and the database has no default for it.
      const { data, error } = await supabase
        .from('cards')
        .insert({ ...payload, user_id: userId })
        .select('id')
        .single()
      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
      navigate(`/vault/cards/${data.id}`)
    }
  }

  // Live slab preview, so the label is checkable before saving.
  const preview = {
    player: d.player || 'Player name',
    year: d.year,
    setName: d.set_name,
    autoType: d.auto_type,
    serialNum: d.serial_num,
    serialTotal: d.serial_total,
    serialKind: d.serial_kind,
    grade: graded ? d.grade : null,
    uniqueSerial: card?.unique_serial ?? null,
    imageUrl: photoPreview ?? (photoRemoved ? null : cardImageUrl(card?.image_path ?? null)),
  }

  return (
    <AppShell
      title={editing ? 'Edit card' : 'Add a card'}
      subtitle={editing ? d.player : 'The label updates as you type.'}
    >
      <Link
        to={editing ? `/vault/cards/${id}` : '/vault/cards'}
        className="mb-6 inline-block text-[0.86rem] text-secondary transition-colors hover:text-primary"
      >
        ← Back
      </Link>

      {editing && loading ? (
        <div className="flex justify-center py-20">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-hairline border-t-brass-bright" />
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,400px)]">
          <div className="space-y-6">
            <Section title="Card">
              <Field label="Player">
                <TextInput value={d.player} onChange={(v) => set('player', v)} placeholder="Player name" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category">
                  <CategoryPicker value={d.category} onChange={(v) => set('category', v)} />
                </Field>
                <Field label="Year">
                  <TextInput value={d.year} onChange={(v) => set('year', v)} placeholder="2024-2025" />
                </Field>
              </div>
              <Field label="Set" hint={knownSets.length ? 'Type a new set, or pick one you already own.' : undefined}>
                <TextInput
                  value={d.set_name}
                  onChange={(v) => set('set_name', v)}
                  placeholder="Topps Reverence"
                  list="known-sets"
                />
                <datalist id="known-sets">
                  {knownSets.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </Field>
              <Field label="Type">
                <Select value={d.auto_type} onChange={(v) => set('auto_type', v)} options={AUTO_TYPES} />
              </Field>
            </Section>

            <Section title="Photo">
              <PhotoPicker
                existingUrl={cardImageUrl(card?.image_path ?? null)}
                file={photo}
                removed={photoRemoved}
                onPick={(f) => {
                  setPhoto(f)
                  setPhotoRemoved(false)
                }}
                onRemove={() => {
                  setPhoto(null)
                  setPhotoRemoved(true)
                }}
                onRestore={() => setPhotoRemoved(false)}
              />
            </Section>

            <Section title="Serial and grade">
              <Field label="Serial">
                <Select value={d.serial_kind} onChange={(v) => set('serial_kind', v)} options={SERIAL_KINDS} />
              </Field>
              {d.serial_kind === 'Serial' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Number">
                    <TextInput
                      value={d.serial_num}
                      onChange={(v) => set('serial_num', sanitizeSerial(v))}
                      // Not inputMode="numeric": that keypad has no minus on
                      // a phone, and a printed serial isn't always positive.
                      inputMode="text"
                      placeholder="10"
                    />
                  </Field>
                  <Field label="Out of">
                    <TextInput
                      value={d.serial_total}
                      onChange={(v) => set('serial_total', v)}
                      inputMode="numeric"
                      placeholder="50"
                    />
                  </Field>
                </div>
              )}
              <Toggle label="Professionally graded" checked={graded} onChange={setGraded} />
              {graded && (
                <Field
                  label="Grade"
                  hint={d.grade ? gradeName(d.grade) : 'The grade replaces the designation on the label.'}
                >
                  <Select
                    value={d.grade}
                    onChange={(v) => set('grade', v)}
                    options={GRADES}
                    placeholder="Choose a grade"
                  />
                </Field>
              )}
            </Section>

            <Section title="Acquisition">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Source">
                  <Select value={d.source} onChange={(v) => set('source', v)} options={SOURCES} />
                </Field>
                <Field label="Bought from">
                  <TextInput value={d.seller} onChange={(v) => set('seller', v)} placeholder="Seller" />
                </Field>
                <Field
                  label="Price paid"
                  hint={
                    allocated == null
                      ? undefined
                      : d.source === 'Opened Wax'
                        ? 'Worked out for you: what the box cost ÷ the cards logged from it. Logging another card re-splits it.'
                        : "Worked out for you: the spot's cost ÷ its hits. Another hit re-splits it."
                  }
                >
                  {allocated == null ? (
                    <TextInput
                      value={d.price_paid}
                      onChange={(v) => set('price_paid', v)}
                      inputMode="decimal"
                      placeholder="0.00"
                    />
                  ) : (
                    <p className="figures rounded-xl border border-hairline bg-raised px-3.5 py-2.5 text-[0.9rem] text-secondary">
                      {money(allocated)}
                    </p>
                  )}
                </Field>
                <Field label="Date acquired">
                  <TextInput
                    value={d.date_acquired}
                    onChange={(v) => set('date_acquired', v)}
                    type="date"
                  />
                </Field>
              </div>

              {/* Only offered for a break-sourced card, since a spot only
                  exists inside a break. */}
              {d.source === 'Break' && (
                <Field
                  label="Break spot"
                  hint={
                    spotOptions.length === 0
                      ? 'No spots yet — add a break and its spots first.'
                      : "Price paid is worked out for you: the spot's cost split across its hits."
                  }
                >
                  <select
                    value={d.break_spot_id}
                    onChange={(e) => set('break_spot_id', e.target.value)}
                    className="w-full cursor-pointer rounded-xl border border-hairline bg-raised px-3.5 py-2.5 text-[0.9rem] text-primary focus:border-brass/60 focus:outline-none"
                  >
                    <option value="">Not from a spot</option>
                    {spotOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              {/* The same treatment for a card out of a box. */}
              {d.source === 'Opened Wax' && (
                <Field
                  label="From box"
                  hint={
                    openedWax.length === 0
                      ? wax.length === 0
                        ? 'No wax logged yet — add a box under Sealed Openings and its cost will spread across the cards you log from it.'
                        : 'All your wax is still sealed. Open a box under Sealed Openings to log cards from it.'
                      : "Price paid is worked out for you: what the box cost split across the cards you've logged from it."
                  }
                >
                  <select
                    value={d.wax_id}
                    onChange={(e) => set('wax_id', e.target.value)}
                    className="w-full cursor-pointer rounded-xl border border-hairline bg-raised px-3.5 py-2.5 text-[0.9rem] text-primary focus:border-brass/60 focus:outline-none"
                  >
                    <option value="">Not from a logged box</option>
                    {openedWax.map((box) => (
                      <option key={box.id} value={box.id}>
                        {box.product}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </Section>

            <Section title="Value and status">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Comp value">
                  <TextInput
                    value={d.comp_value}
                    onChange={(v) => set('comp_value', v)}
                    inputMode="decimal"
                    placeholder="0.00"
                  />
                </Field>
                <Field label="Status">
                  <Select value={d.status} onChange={(v) => set('status', v)} options={STATUSES} />
                </Field>
              </div>
              <Field label="Comp notes">
                <TextInput value={d.comp_notes} onChange={(v) => set('comp_notes', v)} />
              </Field>
              {d.status === 'Sold' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Sold price">
                    <TextInput
                      value={d.sold_price}
                      onChange={(v) => set('sold_price', v)}
                      inputMode="decimal"
                    />
                  </Field>
                  <Field label="Sold date">
                    <TextInput value={d.sold_date} onChange={(v) => set('sold_date', v)} type="date" />
                  </Field>
                </div>
              )}
              <Field label="Notes">
                <TextArea value={d.notes} onChange={(v) => set('notes', v)} />
              </Field>
            </Section>

            {error && (
              <p className="rounded-xl border border-loss/40 bg-loss/10 p-4 text-[0.88rem] text-loss">
                {error}
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="cursor-pointer rounded-full bg-gradient-to-b from-brass-bright to-brass px-6 py-2.5 text-[0.9rem] font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Add card'}
              </button>
              <Link
                to={editing ? `/vault/cards/${id}` : '/vault/cards'}
                className="text-[0.88rem] text-secondary transition-colors hover:text-primary"
              >
                Cancel
              </Link>
            </div>
          </div>

          <div className="lg:sticky lg:top-8 lg:self-start">
            <Slab card={preview} />
            <p className="mt-3 px-1 text-[0.76rem] text-tertiary">
              {editing
                ? 'Changes go live everywhere as soon as you save.'
                : 'A Slabd serial and QR code are assigned when you save.'}
            </p>
          </div>
        </div>
      )}
    </AppShell>
  )
}
