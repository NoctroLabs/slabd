import { Link } from 'react-router-dom'
import { Slab } from '../components/Slab'
import { AppStoreButton } from '../components/AppStore'
import { Footer, Nav } from '../components/Chrome'
import { AppOnly } from '../components/PlatformBadge'
import { heroCard } from '../lib/demo'

function Rule({ label }: { label: string }) {
  return (
    <div className="mb-12 flex items-center justify-center gap-4">
      <span className="h-px w-10 bg-gradient-to-r from-transparent to-brass/60" />
      <span className="font-display text-[0.72rem] font-bold tracking-[0.22em] text-brass uppercase">
        {label}
      </span>
      <span className="h-px w-10 bg-gradient-to-l from-transparent to-brass/60" />
    </div>
  )
}

/** `app` marks a feature the web vault does not have. Held as data next to the
 *  copy so a feature and its platform can never drift apart, the same reason
 *  the pricing tiers are built from a list rather than written out twice. */
const features: { title: string; body: string; app?: boolean }[] = [
  {
    title: 'Every card, catalogued',
    body: 'Player, year, set, parallel and print run. Photograph it once with the guided camera in the app and it is logged, sorted and searchable from your phone or any browser.',
  },
  {
    title: 'What it is worth',
    body: 'Pull live market comparables from eBay in the app, record what you paid, and see profit and loss across the whole collection on either side.',
  },
  {
    title: 'Grade before you send',
    body: 'An on-device estimate of centering, corners, edges and surface, so you know whether a card is worth the grading fee first.',
    app: true,
  },
  {
    title: 'Break tracking',
    body: 'Buy into a break, log the spots and hits, and see the real cost per card once a box is split rather than a lump sum.',
  },
  {
    title: 'Sealed wax',
    body: 'Log a box while it is sealed and track what it is worth. Open it and what you paid spreads across the cards you pull, so you know whether the box beat its price.',
  },
  {
    title: 'Insurance-ready records',
    body: 'Export the collection as a formatted PDF with photos and values, ready to hand to an insurer or attach to a claim.',
    app: true,
  },
  {
    title: 'Share a card, not your account',
    body: 'Every card gets a public page showing the card and its serial. Nothing about what you paid, or what else you own.',
  },
]

const steps: { n: string; title: string; body: string; app?: boolean }[] = [
  {
    n: '01',
    title: 'Photograph the card',
    body: 'The guided camera frames to real card dimensions and waits for focus, so the shot is square and sharp.',
    app: true,
  },
  {
    n: '02',
    title: 'It gets slabbed',
    body: 'Your raw card is presented in a Slabd case, with its own permanent ten digit serial pressed into the label.',
  },
  {
    n: '03',
    title: 'Prove it is yours',
    body: 'Scan the QR on any card and it opens a public verification page for that exact card. Nothing else is exposed.',
  },
]

export function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_50%_-10%,#1b2029_0%,var(--color-ink)_60%)]">
      <Nav />

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-14 px-5 pt-16 pb-24 lg:grid-cols-2 lg:gap-20 lg:pt-24">
        <div>
          <p className="font-display mb-5 text-[0.72rem] font-bold tracking-[0.22em] text-brass uppercase">
            An iPhone app for serious collectors
          </p>
          <h1 className="font-display text-[2.6rem] leading-[1.08] font-bold text-primary sm:text-[3.4rem]">
            Your collection,
            <br />
            <span className="text-brass-bright">properly kept.</span>
          </h1>
          <p className="mt-6 max-w-lg text-[1.05rem] leading-relaxed text-secondary">
            Slabd catalogues every card you own, tracks what it is worth, and gives each one a
            permanent serial and its own verification page. Raw cards, presented like they were
            graded.
          </p>

          {/* The app is the product; the download is the primary action. The
              web vault sits underneath it as somewhere to sign in, not as an
              alternative way to start. */}
          <div className="mt-9">
            <AppStoreButton />
          </div>

          <p className="mt-7 text-[0.86rem] text-secondary">
            Already have an account?{' '}
            <Link to="/signin" className="text-brass-bright hover:underline">
              Open your vault in the browser
            </Link>
          </p>

          <p className="mt-6 text-[0.8rem] text-tertiary">
            Football, WWE, Pokémon and anything else worth keeping.
          </p>
        </div>

        {/* The product itself as the hero image, rather than a mockup of it. */}
        <div className="mx-auto w-full max-w-[380px] lg:max-w-[420px]">
          <Slab card={heroCard} />
        </div>
      </section>

      {/* The differentiator */}
      <section className="border-y border-hairline/70 bg-surface/40 px-5 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <Rule label="What makes it different" />
          <h2 className="font-display text-[1.9rem] leading-tight font-bold text-primary sm:text-[2.3rem]">
            A raw card nobody can vouch for is just a photo.
          </h2>
          <p className="mt-5 text-[1.02rem] leading-relaxed text-secondary">
            Grading companies solved this with a slab and a certificate number, but only for cards
            worth the fee and the wait. Slabd gives every card in your collection the same
            treatment: a permanent serial, a QR code, and a page anyone can open to see that the
            card is real, catalogued and yours.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <Rule label="How it works" />
          <div className="grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((s) => (
              <div key={s.n} className="text-center md:text-left">
                <div className="font-display mb-4 text-[2.4rem] leading-none font-black text-brass/35">
                  {s.n}
                </div>
                <div className="mb-2.5 flex items-center justify-center gap-2.5 md:justify-start">
                  <h3 className="font-display text-[1.15rem] font-bold text-primary">{s.title}</h3>
                  {s.app && <AppOnly />}
                </div>
                <p className="text-[0.94rem] leading-relaxed text-secondary">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Where the website fits. Said plainly, because a web app that looks
          like the whole product sets people up to wonder why the camera and
          the grade estimate aren't there. */}
      <section className="border-t border-hairline/70 px-5 py-20">
        <div className="mx-auto max-w-3xl">
          <Rule label="The app and the website" />
          <div className="grid gap-8 sm:grid-cols-2">
            <div className="rounded-2xl border border-brass/30 bg-surface p-7">
              <h3 className="font-display mb-2.5 text-[1.05rem] font-bold text-brass-bright">
                On your iPhone
              </h3>
              <p className="text-[0.94rem] leading-relaxed text-secondary">
                Where the collection lives. The guided camera, the grade estimate, break tracking,
                comps and the slab labels — everything, in your pocket, at the table.
              </p>
            </div>
            <div className="rounded-2xl border border-hairline bg-surface p-7">
              <h3 className="font-display mb-2.5 text-[1.05rem] font-bold text-primary">
                In the browser
              </h3>
              <p className="text-[0.94rem] leading-relaxed text-secondary">
                A companion for the jobs a phone is bad at: typing up a batch of cards on a real
                keyboard, importing a spreadsheet, and reading the insurance report on a big
                screen. Same account, same collection.
              </p>
            </div>
          </div>
          <p className="mt-7 text-center text-[0.86rem] text-tertiary">
            The website isn't a trial or a cut-down version — it's the same vault, opened from a
            desk. There's no Android app yet, and no iPad build.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-hairline/70 px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <Rule label="Everything in one place" />
          {/* Says which half is which before the grid does, so a badge on a
              card reads as a platform mark rather than an unexplained label. */}
          <p className="mx-auto mb-10 max-w-2xl text-center text-[0.94rem] leading-relaxed text-secondary">
            The iPhone app captures, grades and prices your cards. The web vault opens the same
            collection on a bigger screen for the bulk work. One account, one collection; anything
            marked <AppOnly decorative className="mx-0.5 align-middle" /> needs the app.
          </p>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="bg-surface p-7 transition-colors hover:bg-raised">
                <div className="mb-2.5 flex items-start justify-between gap-3">
                  <h3 className="font-display text-[1.05rem] font-bold text-brass-bright">
                    {f.title}
                  </h3>
                  {f.app && <AppOnly className="mt-1" />}
                </div>
                <p className="text-[0.92rem] leading-relaxed text-secondary">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="px-5 pt-8 pb-24">
        <div className="mx-auto max-w-3xl rounded-3xl border border-brass/30 bg-gradient-to-b from-surface to-ink px-8 py-14 text-center">
          <h2 className="font-display text-[1.8rem] leading-tight font-bold text-primary sm:text-[2.1rem]">
            Start with one card.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[1rem] leading-relaxed text-secondary">
            Free while we're in beta, and everyone who joins during beta keeps the full version for
            good.
          </p>
          <div className="mt-8 flex flex-col items-center">
            <AppStoreButton />
          </div>
          <p className="mt-6 text-[0.84rem] text-tertiary">
            <Link to="/pricing" className="transition-colors hover:text-secondary">
              What's free, and what isn't
            </Link>
            <span className="px-2">·</span>
            <Link to="/roadmap" className="transition-colors hover:text-secondary">
              What's coming next
            </Link>
          </p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
