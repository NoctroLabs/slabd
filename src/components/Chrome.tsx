import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

/** The engraved wordmark, same treatment as the app's footer: a muted brass
 *  fill with a dark shadow above and a light catch below, so it reads as a
 *  groove cut into the surface rather than printed on. */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`font-display font-bold tracking-[0.3em] text-brass-bright ${className}`}
      style={{ textShadow: '0 -1px 0 rgba(0,0,0,0.85), 0 1px 0 rgba(255,255,255,0.10)' }}
    >
      SLABD
    </span>
  )
}

export function Nav() {
  const { session } = useAuth()

  return (
    <header className="sticky top-0 z-20 border-b border-hairline/70 bg-ink/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="shrink-0">
          <Wordmark className="text-[0.95rem]" />
        </Link>

        <div className="flex items-center gap-6 text-[0.86rem] text-secondary">
          <a href="#how" className="hidden transition-colors hover:text-primary sm:block">
            How it works
          </a>
          <a href="#features" className="hidden transition-colors hover:text-primary sm:block">
            Features
          </a>
          <Link to="/pricing" className="transition-colors hover:text-primary">
            Pricing
          </Link>
          <Link
            to="/roadmap"
            className="hidden transition-colors hover:text-primary sm:block"
          >
            Roadmap
          </Link>
          {session ? (
            <>
              <Link to="/vault" className="transition-colors hover:text-primary">
                My vault
              </Link>
              <button
                onClick={() => supabase.auth.signOut()}
                className="cursor-pointer transition-colors hover:text-primary"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/signin"
              className="rounded-full bg-gradient-to-b from-brass-bright to-brass px-4 py-2 font-semibold text-ink transition-opacity hover:opacity-90"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-hairline/70 px-5 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-center">
        <Wordmark className="text-[0.8rem] opacity-60" />
        <p className="text-[0.78rem] text-tertiary">
          A collection belongs in a vault, not a shoebox.
        </p>
        <p className="text-[0.78rem] text-tertiary">
          <Link to="/pricing" className="transition-colors hover:text-secondary">
            Pricing
          </Link>
          <span className="px-2">·</span>
          <Link to="/roadmap" className="transition-colors hover:text-secondary">
            Roadmap
          </Link>
          <span className="px-2">·</span>
          <Link to="/privacy" className="transition-colors hover:text-secondary">
            Privacy
          </Link>
          <span className="px-2">·</span>
          <Link to="/terms" className="transition-colors hover:text-secondary">
            Terms
          </Link>
          <span className="px-2">·</span>
          <a href="mailto:hello@slabd.app" className="transition-colors hover:text-secondary">
            hello@slabd.app
          </a>
        </p>
      </div>
    </footer>
  )
}
