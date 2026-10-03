/** The App Store link, in one place.
 *
 *  The app is in review, so there is no URL yet. Rather than scatter
 *  "coming soon" copy across the site and hunt for it later, every download
 *  call-to-action renders from here: set `APP_STORE_URL` when the listing goes
 *  live and every one of them becomes a real link.
 *
 *  Deliberately not a fake link to a holding page. A button that looks live
 *  and goes nowhere is worse than one that says plainly it isn't ready. */
export const APP_STORE_URL: string | null = null

/** iOS version the app requires, stated wherever we ask someone to download
 *  it — there is no point sending an iPhone 6 owner to the App Store. */
const REQUIREMENT = 'iPhone · iOS 17 or later'

export function AppStoreButton({ size = 'large' }: { size?: 'large' | 'small' }) {
  const padding = size === 'large' ? 'px-7 py-3.5' : 'px-5 py-2.5 text-[0.88rem]'

  if (!APP_STORE_URL) {
    return (
      <div className="flex flex-col gap-2">
        <span
          className={`inline-flex cursor-default items-center gap-2.5 rounded-full border border-brass/40 bg-brass/10 font-semibold text-brass-bright ${padding}`}
        >
          <AppleMark />
          Coming to the App Store
        </span>
        <span className="text-[0.78rem] text-tertiary">
          In review now. {REQUIREMENT}.
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <a
        href={APP_STORE_URL}
        className={`inline-flex items-center gap-2.5 rounded-full bg-gradient-to-b from-brass-bright to-brass font-semibold text-ink transition-opacity hover:opacity-90 ${padding}`}
      >
        <AppleMark />
        Download for iPhone
      </a>
      <span className="text-[0.78rem] text-tertiary">{REQUIREMENT}</span>
    </div>
  )
}

function AppleMark() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 fill-current">
      <path d="M11.2 8.5c0-1.4.9-2.2 1-2.3-.5-.8-1.4-.9-1.7-.9-.7-.1-1.4.4-1.8.4-.4 0-1-.4-1.6-.4-.8 0-1.6.5-2 1.2-.9 1.5-.2 3.7.6 4.9.4.6.9 1.3 1.5 1.3.6 0 .8-.4 1.5-.4s.9.4 1.5.4c.6 0 1.1-.6 1.5-1.2.3-.5.5-1 .5-1-.1 0-1.5-.6-1.5-2zM9.8 4.4c.3-.4.6-1 .5-1.6-.5 0-1.1.3-1.5.8-.3.4-.6 1-.5 1.5.6.1 1.2-.3 1.5-.7z" />
    </svg>
  )
}
