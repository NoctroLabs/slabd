import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom'
import { Home } from './pages/Home'
import { SignIn } from './pages/SignIn'
import { Dashboard } from './pages/Dashboard'
import { Welcome } from './pages/Welcome'
import { Cards } from './pages/Cards'
import { CardDetail } from './pages/CardDetail'
import { CardForm } from './pages/CardForm'
import { Data } from './pages/Data'
import { Breaks } from './pages/Breaks'
import { Wax } from './pages/Wax'
import { WaxForm } from './pages/WaxForm'
import { WaxDetail } from './pages/WaxDetail'
import { BreakDetail } from './pages/BreakDetail'
import { BreakForm } from './pages/BreakForm'
import { Wants } from './pages/Wants'
import { WantForm } from './pages/WantForm'
import { Settings } from './pages/Settings'
import { Verify } from './pages/Verify'
import { Pricing } from './pages/Pricing'
import { Roadmap } from './pages/Roadmap'
import { Privacy } from './pages/Privacy'
import { Terms } from './pages/Terms'
import { ResetPassword } from './pages/ResetPassword'

/** The root path does double duty. A scanned QR arrives as `/?s=<serial>`
 *  and must show the verification page; everything else is the marketing
 *  homepage. Keeping verification on a query param rather than its own path
 *  means it resolves with a real 200 on static hosting, instead of relying
 *  on the SPA 404 fallback the way the other routes do. */
function Root() {
  const [params] = useSearchParams()
  const serial = params.get('s')
  return serial ? <Verify serial={serial} /> : <Home />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Root />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/reset" element={<ResetPassword />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        {/* Declared before the other vault routes: first run has to win. */}
        <Route path="/vault/welcome" element={<Welcome />} />
        <Route path="/vault" element={<Dashboard />} />
        <Route path="/vault/cards" element={<Cards />} />
        {/* `new` is declared before `:id` so it isn't captured as a card id. */}
        <Route path="/vault/cards/new" element={<CardForm />} />
        <Route path="/vault/cards/:id" element={<CardDetail />} />
        <Route path="/vault/cards/:id/edit" element={<CardForm />} />
        <Route path="/vault/data" element={<Data />} />
        <Route path="/vault/wants" element={<Wants />} />
        <Route path="/vault/wants/new" element={<WantForm />} />
        <Route path="/vault/wants/:id/edit" element={<WantForm />} />
        <Route path="/vault/breaks" element={<Breaks />} />
        <Route path="/vault/wax" element={<Wax />} />
        <Route path="/vault/wax/new" element={<WaxForm />} />
        <Route path="/vault/wax/:id" element={<WaxDetail />} />
        <Route path="/vault/wax/:id/edit" element={<WaxForm />} />
        {/* `new` before `:id`, so it is not captured as a break id. */}
        <Route path="/vault/breaks/new" element={<BreakForm />} />
        <Route path="/vault/breaks/:id" element={<BreakDetail />} />
        <Route path="/vault/breaks/:id/edit" element={<BreakForm />} />
        <Route path="/vault/settings" element={<Settings />} />
        <Route path="*" element={<Root />} />
      </Routes>
    </BrowserRouter>
  )
}
