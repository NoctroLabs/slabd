import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Field, Section, Select, TextArea, TextInput } from '../components/Field'
import { useWax } from '../hooks/useWax'
import { supabase } from '../lib/supabase'
import { WAX_ACQUISITION, WAX_FORMATS } from '../lib/types'

const str = (v: string) => (v.trim() === '' ? null : v.trim())
/** Empty stays empty. A blank price and a price of zero are different facts —
 *  "I haven't recorded this" versus "it was free" — and writing 0 for the
 *  first makes the collection totals look authoritative about a number nobody
 *  entered. Mirrors `num` in the card form. */
const num = (v: string) => {
  if (v.trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function WaxForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const { wax, loading } = useWax()

  const [product, setProduct] = useState('')
  const [format, setFormat] = useState<string>('Blaster')
  const [acquisition, setAcquisition] = useState<string>('Retail')
  const [status, setStatus] = useState<string>('Sealed')
  const [pricePaid, setPricePaid] = useState('')
  const [msrp, setMsrp] = useState('')
  const [compValue, setCompValue] = useState('')
  const [seller, setSeller] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const existing = useMemo(() => wax.find((w) => w.id === id), [wax, id])

  useEffect(() => {
    if (!existing) return
    setProduct(existing.product ?? '')
    setFormat(existing.format ?? 'Blaster')
    setAcquisition(existing.acquisition ?? 'Retail')
    setStatus(existing.status ?? 'Sealed')
    setPricePaid(existing.price_paid?.toString() ?? '')
    setMsrp(existing.msrp?.toString() ?? '')
    setCompValue(existing.comp_value?.toString() ?? '')
    setSeller(existing.seller ?? '')
    setPurchaseDate(existing.purchase_date ?? '')
    setNotes(existing.notes ?? '')
  }, [existing])

  const isSealedNow = status === 'Sealed'

  async function save() {
    if (!product.trim()) {
      setError('It needs a name — what is the box?')
      return
    }
    setSaving(true)
    setError(null)

    const payload = {
      product: product.trim(),
      format,
      acquisition,
      status,
      price_paid: num(pricePaid),
      msrp: num(msrp),
      // A value only means something while it's sealed. Keeping it after
      // opening would leave a stale figure counting towards the collection
      // total for a box that no longer exists.
      comp_value: isSealedNow ? num(compValue) : null,
      seller: str(seller),
      purchase_date: str(purchaseDate),
      notes: str(notes),
    }

    if (editing) {
      const { error } = await supabase.from('wax').update(payload).eq('id', id!)
      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
      navigate(`/vault/wax/${id}`)
    } else {
      const { data: auth } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('wax')
        .insert({ ...payload, user_id: auth.user?.id })
        .select('id')
        .single()
      if (error) {
        setError(error.message)
        setSaving(false)
        return
      }
      navigate(`/vault/wax/${data.id}`)
    }
  }

  return (
    <AppShell
      title={editing ? 'Edit wax' : 'Add wax'}
      subtitle={editing ? undefined : 'A box you bought. Keep it sealed, or open it and log what came out.'}
    >
      <Link
        to={editing ? `/vault/wax/${id}` : '/vault/wax'}
        className="mb-6 inline-block text-[0.86rem] text-secondary transition-colors hover:text-primary"
      >
        ← Back
      </Link>

      {editing && loading ? (
        <div className="flex justify-center py-20">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-hairline border-t-brass-bright" />
        </div>
      ) : (
        <div className="max-w-2xl">
          <Section title="Product">
            <Field label="What is it">
              <TextInput
                value={product}
                onChange={setProduct}
                placeholder="2026 Topps WWE Universe"
              />
            </Field>
            <Field label="Format">
              <Select value={format} onChange={setFormat} options={[...WAX_FORMATS]} />
            </Field>
          </Section>

          <Section title="Cost">
            <Field label="Bought">
              <Select
                value={acquisition}
                onChange={setAcquisition}
                options={[...WAX_ACQUISITION]}
              />
            </Field>
            <Field
              label="Paid"
              hint={
                isSealedNow
                  ? "While it's sealed, nothing is charged to any card. Opening it splits this across the cards you log from it."
                  : 'Split evenly across the cards you log from this box. Logging another card re-splits it.'
              }
            >
              <TextInput value={pricePaid} onChange={setPricePaid} placeholder="24.99" />
            </Field>
            <Field
              label="Retail price"
              hint="What it cost at retail. Kept separately so you can see what a secondary-market box cost you over the odds."
            >
              <TextInput value={msrp} onChange={setMsrp} placeholder="24.99" />
            </Field>
          </Section>

          <Section title="Status">
            <Field
              label="Sealed or opened"
              hint="Opening it stops tracking it as a box and starts spreading what you paid across the cards you log from it."
            >
              <Select value={status} onChange={setStatus} options={['Sealed', 'Opened']} />
            </Field>
            {isSealedNow && (
              <Field
                label="Sealed value now"
                hint="What a sealed one goes for today. Counts towards your collection value until you open it."
              >
                <TextInput value={compValue} onChange={setCompValue} placeholder="60.00" />
              </Field>
            )}
          </Section>

          <Section title="Where and when">
            <Field label="Bought from">
              <TextInput value={seller} onChange={setSeller} placeholder="Shop or seller" />
            </Field>
            <Field label="Bought on">
              <TextInput value={purchaseDate} onChange={setPurchaseDate} type="date" />
            </Field>
          </Section>

          <Section title="Notes">
            <Field label="Anything worth remembering">
              <TextArea value={notes} onChange={setNotes} />
            </Field>
          </Section>

          {error && (
            <p className="mt-4 rounded-xl border border-loss/40 bg-loss/10 p-3 text-[0.86rem] text-loss">
              {error}
            </p>
          )}

          <div className="mt-7 flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="cursor-pointer rounded-full bg-gradient-to-b from-brass-bright to-brass px-6 py-2.5 text-[0.9rem] font-semibold text-ink transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add wax'}
            </button>
            <Link
              to={editing ? `/vault/wax/${id}` : '/vault/wax'}
              className="text-[0.88rem] text-secondary transition-colors hover:text-primary"
            >
              Cancel
            </Link>
          </div>
        </div>
      )}
    </AppShell>
  )
}
