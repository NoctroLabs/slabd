import { Link } from 'react-router-dom'
import { Footer, Nav } from '../components/Chrome'
import { AppOnly } from '../components/PlatformBadge'
import { useAuth } from '../hooks/useAuth'

/** What each plan includes.
 *
 *  `free` is what the free tier gets; anything false is Premium only. Kept as
 *  data rather than two hand-written lists so the two columns can never drift
 *  apart and claim different things.
 *
 *  `app` marks a row the web vault does not have. A plan and a platform are
 *  different questions, so it is a separate field rather than a fourth column:
 *  paying for Premium does not put the insurance PDF in a browser, and the
 *  table should not imply it does. */
const FEATURES: { label: string; detail?: string; free: boolean | string; app?: boolean }[] = [
  { label: 'Cards', detail: 'How many you can log', free: '75' },
  { label: 'Digital slab labels', detail: 'Every card gets one', free: true },
  { label: 'Serial and QR code', detail: 'A public page per card', free: true },
  { label: 'Card photos', free: true },
  { label: 'Grades and print runs', free: true },
  { label: 'Want list', detail: 'With target prices', free: true },
  { label: 'Collection totals', detail: 'Value, spend, profit', free: true },
  { label: 'Export your data', detail: 'CSV, whenever you like', free: true },
  { label: 'Import from CSV', detail: 'Bring a collection with you', free: false },
  { label: 'Break tracking', detail: 'Spots, hits and cost per hit', free: false },
  { label: 'Sealed wax', detail: 'Track boxes, then split the cost across your hits', free: false },
  { label: 'Insurance report', detail: 'A PDF of the whole collection', free: false, app: true },
  { label: 'Value over time', detail: 'Recorded nightly', free: false },
]

function Tick() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" className="shrink-0">
      <path
        d="M3 8.5l3.2 3.2L13 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Pricing() {
  const { session } = useAuth()

  return (
    <div className="min-h-screen bg-ink">
      <Nav />

      <main className="mx-auto max-w-5xl px-5 py-16">
        <header className="max-w-2xl">
          <p className="font-display text-[0.72rem] tracking-[0.2em] text-brass uppercase">
            Pricing
          </p>
          <h1 className="font-display mt-3 text-[clamp(2rem,5vw,2.7rem)] leading-tight font-bold text-primary">
            Free while we're in beta
          </h1>
          <p className="mt-4 text-[1.02rem] leading-relaxed text-secondary">
            Everything is free right now, for everyone. And if you join during beta, you keep the
            full version free for good — not a trial, not a discount that lapses.
          </p>
        </header>

        {/* The founding offer is the actual news, so it leads rather than
            sitting as a footnote under the tiers. */}
        <section className="mt-10 rounded-2xl border border-brass/40 bg-gradient-to-b from-brass/[0.07] to-transparent p-7">
          <h2 className="font-display text-[1.2rem] font-bold text-brass-bright">
            Founding members keep everything
          </h2>
          <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-secondary">
            Sign up before beta ends and your account is marked as founding. When paid plans arrive
            you won't be asked for anything — you'll have Premium, permanently, on the house. It's
            the trade for putting up with a young app and telling us what's broken.
          </p>
          {!session && (
            <Link
              to="/signin"
              className="mt-6 inline-block rounded-full bg-gradient-to-b from-brass-bright to-brass px-6 py-3 text-[0.92rem] font-semibold text-ink transition-opacity hover:opacity-90"
            >
              Claim founding access
            </Link>
          )}
        </section>

        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-hairline bg-surface p-7">
            <h2 className="font-display text-[1.3rem] font-bold text-primary">Free</h2>
            <p className="mt-1.5 text-[0.9rem] text-secondary">
              Enough to keep a real collection, for nothing.
            </p>
            <p className="font-display figures mt-6 text-[2.6rem] leading-none font-bold text-primary">
              £0
            </p>
            <p className="mt-2 text-[0.82rem] text-tertiary">Always. No card needed.</p>
          </section>

          <section className="rounded-2xl border border-brass/50 bg-surface p-7">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-[1.3rem] font-bold text-primary">Premium</h2>
              <span className="font-display rounded-full border border-brass/50 px-2.5 py-1 text-[0.68rem] tracking-[0.12em] text-brass-bright uppercase">
                Later
              </span>
            </div>
            <p className="mt-1.5 text-[0.9rem] text-secondary">
              For a collection that's outgrown a spreadsheet.
            </p>
            <p className="font-display figures mt-6 text-[2.6rem] leading-none font-bold text-primary">
              £4.99
              <span className="font-display ml-1 text-[0.95rem] font-normal text-secondary">
                / month
              </span>
            </p>
            <p className="figures mt-2 text-[0.86rem] text-secondary">
              or £39.99 a year — two months free
            </p>
            <p className="mt-3 text-[0.82rem] text-tertiary">
              Not charging yet. Nothing to cancel, nothing to opt out of.
            </p>
          </section>
        </div>

        <section className="mt-14">
          <h2 className="font-display text-[1.4rem] font-bold text-primary">
            What's in each plan
          </h2>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-[0.92rem]">
              <thead>
                <tr>
                  <th className="border-b border-hairline px-4 py-3 text-left text-[0.7rem] font-medium tracking-[0.12em] text-tertiary uppercase">
                    Feature
                  </th>
                  <th className="w-28 border-b border-hairline px-4 py-3 text-center text-[0.7rem] font-medium tracking-[0.12em] text-tertiary uppercase">
                    Free
                  </th>
                  <th className="w-28 border-b border-hairline px-4 py-3 text-center text-[0.7rem] font-medium tracking-[0.12em] text-brass-bright uppercase">
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((f) => (
                  <tr key={f.label}>
                    <td className="border-b border-hairline px-4 py-3">
                      <span className="flex items-center gap-2">
                        <span className="text-primary">{f.label}</span>
                        {f.app && <AppOnly />}
                      </span>
                      {f.detail && (
                        <span className="block text-[0.8rem] text-tertiary">{f.detail}</span>
                      )}
                    </td>
                    <td className="figures border-b border-hairline px-4 py-3 text-center">
                      {typeof f.free === 'string' ? (
                        <span className="text-primary">{f.free}</span>
                      ) : f.free ? (
                        <span className="inline-flex text-gain" title="Included">
                          <Tick />
                        </span>
                      ) : (
                        <span className="text-tertiary" title="Premium only">
                          —
                        </span>
                      )}
                    </td>
                    <td className="figures border-b border-hairline px-4 py-3 text-center">
                      {typeof f.free === 'string' ? (
                        <span className="text-primary">Unlimited</span>
                      ) : (
                        <span className="inline-flex text-gain" title="Included">
                          <Tick />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* The tick columns answer "which plan", not "which device". Without
              this the two questions read as one, and a web subscriber goes
              looking for an export that was never in a browser. */}
          <p className="mt-5 text-[0.86rem] leading-relaxed text-tertiary">
            Plans cover both platforms: one account, one collection, whether you open it on your
            phone or in a browser. Rows marked{' '}
            <AppOnly decorative className="mx-0.5 align-middle" /> are in the iPhone app only, and
            everything else works in both.
          </p>
        </section>

        <section className="mt-14 grid gap-8 border-t border-hairline pt-10 sm:grid-cols-2">
          <div>
            <h3 className="font-display text-[1.02rem] font-bold text-primary">
              Your data is never held hostage
            </h3>
            <p className="mt-2 text-[0.92rem] leading-relaxed text-secondary">
              Exporting your whole collection as a spreadsheet is free on every plan and always will
              be. Charging you to get your own records out would be indefensible, and it's how you
              exercise your data rights under UK law.
            </p>
          </div>

          <div>
            <h3 className="font-display text-[1.02rem] font-bold text-primary">
              Sharing stays free too
            </h3>
            <p className="mt-2 text-[0.92rem] leading-relaxed text-secondary">
              Every card gets its serial, its QR code and its public page on the free plan. Showing
              somebody a card is how people find SLABD — it isn't something to charge for.
            </p>
          </div>

          <div>
            <h3 className="font-display text-[1.02rem] font-bold text-primary">
              What happens at 75 cards
            </h3>
            <p className="mt-2 text-[0.92rem] leading-relaxed text-secondary">
              Nothing disappears. Everything you've logged stays yours to view, edit and export —
              you just can't add a 76th until you upgrade. No card is ever locked behind a paywall
              after you've entered it.
            </p>
          </div>

          <div>
            <h3 className="font-display text-[1.02rem] font-bold text-primary">
              Prices could still move
            </h3>
            <p className="mt-2 text-[0.92rem] leading-relaxed text-secondary">
              Premium isn't live yet, and these figures are what we intend to charge rather than
              what you've been billed. Founding members are unaffected either way.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
