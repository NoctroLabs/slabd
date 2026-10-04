# SLABD web vault

The web companion to the SLABD iPhone app. Both sign into the same Supabase
project and read and write the same tables, so **this repo is one of two
clients over one database**. Almost everything below follows from that.

React 19, Vite, Tailwind 4, `@supabase/supabase-js`, TypeScript strict.
Deployed to GitHub Pages on the custom domain `slabd.app`.

## The one command

```
npm run verify      # tsc -b, then oxlint, then the unit tests
```

Run it before saying a change is done, and paste the result rather than
describing it. `npm test` alone runs just the tests. Lint currently emits 18
warnings and zero errors: 17 `set-state-in-effect` and one
`only-export-components`. Those are known and listed under **Deliberate, not
broken** below. A change should not add to that count.

## Read this before touching a shared rule

Four rules are implemented twice, once here in TypeScript and once in Swift in
the iOS repo, `NoctroLabs/slabd-ios`. `shared/fixtures/` holds the contract as
JSON cases, with `shared/fixtures/README.md` explaining the setup. **Only this
side runs them as tests so far**; wiring the Swift side up to the same files is
the obvious next step, and until then the two are held in step by hand.

| Rule | Here | iOS |
| --- | --- | --- |
| CSV date normalising | `normalizeDate` in `src/lib/csv.ts` | `normalizeDateField` in `CSV.swift` |
| Break cost per hit | `perHitCost` in `src/lib/breaks.ts` | `perHit` in `BreakSpotDetailView.swift` |
| Card profit and loss | `profitLoss` in `src/lib/format.ts` | `Card.profitLoss` |
| CSV columns | `CSV_COLUMNS` in `src/lib/csv.ts` | `Card.csvColumns` in `CSV.swift` |

**Changing one of these means changing the fixture, and the iOS side has to
change with it.** Do not "fix" one of these functions to match a bug report
without saying out loud that the other codebase needs the same change. A silent
divergence here corrupts data with nothing visible on screen.

Four more things are held in step by hand and have no fixture yet. Treat a
change to any of them as needing the same care:

- `GRADE_NAMES` in `src/lib/types.ts` matches `VaultSlabFrame.gradeNames`.
- The `Designation` precedence in `src/components/Slab.tsx` matches the app's
  slab label logic (a real grade wins the slot; otherwise print run, special
  designation, or the 1-of-1 treatment).
- The picker options in `src/lib/options.ts` match the enums in the app's
  `Card.swift`. These are stored as raw strings, so a mismatch shows as a blank
  picker on the other side.
- **A card has one cost basis.** `break_spot_id` and `wax_id` are mutually
  exclusive, enforced by a CHECK constraint, because two allocation triggers
  would each write `price_paid`.
- **The cost allocation rule lives in the database, once**, in
  `reallocate_cost_pool`: a break spot's cost and a sealed box's price both
  divide across the cards linked to them. Never reimplement it in a client. It
  used to live in both and they drifted.
- The colour and font tokens in `src/index.css` come from the app's
  `Theme.swift`. JPEG quality 0.82 and the `<user id>/<uuid>.jpg` storage path
  in `src/lib/images.ts` match the app too, and the path shape is what the
  bucket's row-level security policy checks.

## Things that will bite you

**Security is row-level security, not client code.** Queries carry no user
filter because Postgres policies scope them server-side. Do not add
`.eq('user_id', ...)` "for safety" and do not assume a missing filter is a bug.
The anon key in `src/lib/supabase.ts` is public by design; it also ships in the
app binary.

**Inserts must set `user_id` explicitly.** The policies check it and the
database has no default for it. Updates and selects must not.

**PostgREST returns numeric columns as strings.** `useBreaks` and `useWants`
coerce them with `Number(...)` on the way in. Without that, every sum
downstream concatenates instead of adding. Any new hook over a numeric column
needs the same treatment.

**Categories belong to the user.** There is no fixed category list. A new
account has none, which is why `AppShell` redirects to `/vault/welcome`.

**Currency is a label, not a conversion.** Nothing records which currency a
price was entered in and there is no exchange rate anywhere. Switching relabels
amounts. Never add conversion without being asked: it would silently rewrite
the meaning of every historical entry.

**`unique_serial` is database-owned.** Exported for reference, never imported.
It is unique-constrained, so writing it back either collides or hands one card
another card's identity.

**Routing is a static host with no rewrite.** Deep links work because
`.github/workflows/deploy.yml` copies `index.html` into a directory per real
route so each answers 200, and into `404.html` as the fallback. **A new route
needs adding to that loop**, or it will render but answer 404, which matters
for anything a crawler or App Store review fetches. Card verification lives on
`/?s=<serial>` rather than its own path so it gets a real 200 either way.

**The asset base path and `public/CNAME` are coupled.** `vite.config.ts` serves
from `/` because the custom domain serves from the root. Remove the domain and
every asset 404s.

## iPhone app only

Do not build these here, and do not describe them on the site as if the web has
them. `src/components/PlatformBadge.tsx` marks them on the homepage and pricing
table.

- The guided camera and photo capture
- Live market comparables from eBay (here, `comp_value` is typed in by hand)
- The on-device grade estimate
- The insurance PDF export
- Want list price checks (the web only reports the result)

## Deliberate, not broken

Do not "improve" these without asking. Each is a known trade-off, not an
oversight:

- **No pagination.** `useCards` fetches the whole collection. Fine at current
  sizes, and the fix is real work, not a one-liner.
- **One JS bundle, no code splitting.** The build warns about the 500 kB
  chunk. Known.
- **17 `set-state-in-effect` lint warnings.** Fixing them is a real refactor of
  the data hooks and forms, not a tidy-up.
- **CSV import is one request per row.** Slow for a large file, and there is no
  transaction, so a part-failed import leaves a partial result.
- **CSV import can duplicate.** Re-importing a file with no `id` column adds
  every row again. Known, unfixed.
- **A failed delete in `CardDetail` shows the user nothing.** Known bug.

## Conventions

- **Comments explain why, not what.** Match the existing density. The
  interesting comments in this codebase record a decision or a trap, and that
  is the house style.
- **Tailwind utilities with the theme tokens** from `src/index.css`. No
  hardcoded hex.
- **Data over duplication.** The pricing tiers and the homepage features are
  arrays with flags rather than hand-written lists, so a feature and its
  platform cannot drift apart. Keep new lists that way.
- **No new dependencies without asking.** The dependency list is short on
  purpose.
- **Tests alongside changes to `src/lib/`.** That directory holds the pure
  functions that guard the data, and it is the only part with real coverage.
  Keep it that way.
- **Never commit real user data, keys beyond the public anon key, or the
  service role key.** The service role key must never reach a browser; account
  deletion goes through the `delete-account` edge function for exactly that
  reason.

## Not in this repo

The Supabase side is not in this repo, but it **is** version-controlled: the
migrations and edge functions live alongside the iOS app, under `supabase/` in
the `NoctroLabs/slabd-ios` repo (private). That covers the row-level security policies,
the `card-data` and `delete-account` functions, the `rename_category` RPC,
`reallocate_cost_pool`, the founding-plan trigger, and the nightly
`collection_snapshots` job.

So a change here that depends on one of those can be checked rather than
guessed at — but it needs that repo open too. Say which you looked at.
