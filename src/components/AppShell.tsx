import { type ReactNode } from 'react'
import { Link, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useCurrency } from '../hooks/useCurrency'
import { useCategories } from '../hooks/useCategories'
import { Wordmark } from './Chrome'

const nav = [
  { to: '/vault', label: 'Dashboard' },
  { to: '/vault/cards', label: 'My cards' },
  { to: '/vault/data', label: 'Import / export' },
  { to: '/vault/wants', label: 'Want list' },
  { to: '/vault/breaks', label: 'Breaks' },
  { to: '/vault/wax', label: 'Sealed Openings' },
  { to: '/vault/settings', label: 'Settings' },
]

/** Sidebar + top bar frame for everything behind sign-in. */
export function AppShell({
  title,
  subtitle,
  children,
  search,
  onSearch,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  search?: string
  onSearch?: (v: string) => void
}) {
  const { session, loading } = useAuth()
  // Subscribed here rather than per page: every `money()` call below reads
  // module state, so this is what makes a currency change repaint the vault.
  useCurrency()
  // A brand-new account has no categories, so the card form's category picker
  // would be empty with nothing explaining why. Send them through setup first.
  const { categories, loading: categoriesLoading } = useCategories()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-hairline border-t-brass-bright" />
      </div>
    )
  }
  if (!session) return <Navigate to="/signin" replace />
  if (!categoriesLoading && categories.length === 0) return <Navigate to="/vault/welcome" replace />

  return (
    <div className="min-h-screen bg-ink lg:flex">
      <aside className="shrink-0 border-b border-hairline bg-surface lg:min-h-screen lg:w-60 lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between px-5 py-5 lg:block">
          <Link to="/">
            <Wordmark className="text-[0.95rem]" />
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:mt-2 lg:flex-col lg:overflow-visible lg:pb-0">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/vault'}
              className={({ isActive }) =>
                `shrink-0 rounded-lg px-3 py-2 text-[0.88rem] transition-colors ${
                  isActive
                    ? 'bg-raised font-medium text-primary'
                    : 'text-secondary hover:bg-raised/60 hover:text-primary'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex items-center gap-4 border-b border-hairline px-5 py-3.5">
          {onSearch ? (
            <input
              value={search ?? ''}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search player, set, seller…"
              className="w-full max-w-md rounded-xl border border-hairline bg-surface px-4 py-2 text-[0.88rem] text-primary placeholder:text-tertiary focus:border-brass/60 focus:outline-none"
            />
          ) : (
            <span className="flex-1" />
          )}
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              navigate('/')
            }}
            className="ml-auto shrink-0 cursor-pointer text-[0.84rem] text-secondary transition-colors hover:text-primary"
          >
            Sign out
          </button>
        </header>

        <main className="px-5 py-8 lg:px-8">
          <h1 className="font-display text-[1.75rem] font-bold text-primary">{title}</h1>
          {subtitle && <p className="mt-1.5 text-[0.92rem] text-secondary">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
