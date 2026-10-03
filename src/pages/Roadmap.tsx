import { Link } from 'react-router-dom'
import { AppStoreButton } from '../components/AppStore'
import { Footer, Nav } from '../components/Chrome'

/** What's built, what's being worked on, and what's being considered.
 *
 *  Written as intentions rather than commitments, and deliberately without
 *  dates. A roadmap with dates on it becomes a list of broken promises the
 *  first time something takes longer than expected — and the honest answer
 *  to "when" on a product this size is "when it's ready".
 *
 *  Keep this page truthful even when that's less flattering. "Considering"
 *  means considering; nothing moves to Building until it actually is. */

type Status = 'done' | 'building' | 'considering'

const ITEMS: { status: Status; title: string; body: string }[] = [
  {
    status: 'done',
    title: 'The catalogue',
    body: 'Player, year, set, parallel, print run, grade and condition, with a guided camera that frames to real card dimensions.',
  },
  {
    status: 'done',
    title: 'Digital slabs, serials and QR verification',
    body: 'Every card gets a permanent ten-digit serial and a public page showing the card and nothing about you.',
  },
  {
    status: 'done',
    title: 'Values and profit tracking',
    body: 'Market comparables pulled from eBay, what you paid, what it sold for, and the profit or loss across the whole collection.',
  },
  {
    status: 'done',
    title: 'Break tracking',
    body: 'Log a break, its spots and its hits, and the cost is split across the cards that actually came out of it.',
  },
  {
    status: 'done',
    title: 'The insurance report',
    body: 'The whole collection as a formatted PDF with photos and values, ready to hand to an insurer.',
  },
  {
    status: 'done',
    title: 'Sealed wax',
    body: 'Track a box while it is sealed, including what you paid against retail and what a sealed one goes for now. Open it and the cost divides across the cards you log from it, the same way a break spot does.',
  },
  {
    status: 'done',
    title: 'The web companion',
    body: 'The same vault in a browser, for typing up batches on a keyboard and importing a spreadsheet.',
  },
  {
    status: 'building',
    title: 'Sold prices, not asking prices',
    body: "Today's comps come from active eBay listings, which is what people are asking rather than what cards actually fetch. Moving to a real sold-price source is the single biggest improvement left in the app.",
  },
  {
    status: 'building',
    title: 'Bulk editing on the web',
    body: 'Changing the same field across twenty cards without opening twenty cards. The keyboard is the reason the website exists; it should be better at this than the phone.',
  },
  {
    status: 'considering',
    title: 'iPad',
    body: 'The layouts would need real work rather than a stretched phone screen, which is why it is not simply switched on.',
  },
  {
    status: 'considering',
    title: 'Android',
    body: 'Asked about often. It is a second app to build and maintain, so it depends on how many people actually want it — tell us if you do.',
  },
  {
    status: 'considering',
    title: 'A public collection page',
    body: 'One link showing a whole collection rather than one card. Only worth doing if it stays opt-in, per card, and never exposes what anything cost.',
  },
  {
    status: 'considering',
    title: 'Trade and sale tracking',
    body: 'Recording where a card went and what came back, so the history survives the card leaving.',
  },
]

const LABELS: Record<Status, string> = {
  done: 'Shipped',
  building: 'Being built',
  considering: 'Considering',
}

/** Status is carried by a label and a position in the list, not by colour
 *  alone — the brass tint is a reinforcement, not the signal. */
const TINTS: Record<Status, string> = {
  done: 'border-brass/40 bg-brass/10 text-brass-bright',
  building: 'border-hairline bg-raised text-primary',
  considering: 'border-hairline bg-surface text-tertiary',
}

function Group({ status }: { status: Status }) {
  const items = ITEMS.filter((i) => i.status === status)

  return (
    <section className="mt-14 first:mt-0">
      <div className="mb-6 flex items-baseline gap-3">
        <h2 className="font-display text-[1.3rem] font-bold text-primary">{LABELS[status]}</h2>
        <span className="figures text-[0.8rem] text-tertiary">{items.length}</span>
      </div>

      <ul className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.title} className="bg-surface p-6">
            <span
              className={`font-display mb-3 inline-block rounded-full border px-2.5 py-1 text-[0.66rem] font-bold tracking-[0.14em] uppercase ${TINTS[status]}`}
            >
              {LABELS[status]}
            </span>
            <h3 className="font-display mb-2 text-[1.02rem] font-bold text-primary">
              {item.title}
            </h3>
            <p className="text-[0.92rem] leading-relaxed text-secondary">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function Roadmap() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_50%_-10%,#1b2029_0%,var(--color-ink)_60%)]">
      <Nav />

      <div className="mx-auto max-w-4xl px-5 pt-16 pb-24">
        <p className="font-display mb-5 text-[0.72rem] font-bold tracking-[0.22em] text-brass uppercase">
          Roadmap
        </p>
        <h1 className="font-display text-[2.2rem] leading-tight font-bold text-primary sm:text-[2.8rem]">
          What we're building next.
        </h1>
        <p className="mt-5 max-w-2xl text-[1.02rem] leading-relaxed text-secondary">
          Slabd is in beta and built by a collector, so this list is what's actually being worked
          on rather than a wishlist. There are no dates on it deliberately — a date on a roadmap is
          a promise you end up apologising for. Things move when they're ready.
        </p>

        <Group status="building" />
        <Group status="considering" />
        <Group status="done" />

        <div className="mt-16 rounded-3xl border border-brass/30 bg-gradient-to-b from-surface to-ink px-8 py-12 text-center">
          <h2 className="font-display text-[1.5rem] leading-tight font-bold text-primary">
            Something missing?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[0.98rem] leading-relaxed text-secondary">
            What gets built next is mostly decided by what people ask for. There's a feature request
            form in the app and on the website, or email us.
          </p>
          <p className="mt-6 text-[0.9rem]">
            <a href="mailto:hello@slabd.app" className="text-brass-bright hover:underline">
              hello@slabd.app
            </a>
          </p>
          <div className="mt-9 flex flex-col items-center">
            <AppStoreButton size="small" />
          </div>
          <p className="mt-6 text-[0.84rem] text-tertiary">
            <Link to="/pricing" className="transition-colors hover:text-secondary">
              Pricing
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  )
}
