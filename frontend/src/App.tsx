import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Toaster } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'

// Primary screens — eagerly loaded so the demo is snappy
import Negotiations from '@/pages/Negotiations'
import DealRoom from '@/pages/DealRoom'

// Secondary — lazy
const BattleCardPage = lazy(() => import('@/pages/BattleCardPage'))
const NewsSignals = lazy(() => import('@/pages/NewsSignals'))
const Vendors = lazy(() => import('@/pages/Vendors'))
const Stakeholders = lazy(() => import('@/pages/Stakeholders'))
const WarGameHome = lazy(() => import('@/pages/WarGameHome'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))

// Deprioritized legacy — lazy too
const WarRoom = lazy(() => import('@/pages/WarRoom'))
const Dossiers = lazy(() => import('@/pages/Dossiers'))
const Signals = lazy(() => import('@/pages/Signals'))
const People = lazy(() => import('@/pages/People'))
const Pipeline = lazy(() => import('@/pages/Pipeline'))
const Ecosystem = lazy(() => import('@/pages/Ecosystem'))
const Digests = lazy(() => import('@/pages/Digests'))
const Chat = lazy(() => import('@/pages/Chat'))
const Notes = lazy(() => import('@/pages/Notes'))
const PreSalesDeal = lazy(() => import('@/pages/PreSalesDeal'))
const BattleCardsLegacy = lazy(() => import('@/pages/BattleCards'))

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return (
    <div className="min-h-screen bg-tdds-100 grid place-items-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-magenta-500" />
    </div>
  )
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function LazyFallback() {
  return (
    <div className="min-h-[60vh] grid place-items-center">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-magenta-500" />
    </div>
  )
}

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
            <Route index element={<Navigate to="/negotiations" replace />} />

            {/* ── Primary ────────────────────────────── */}
            <Route path="negotiations" element={<Negotiations />} />
            <Route path="negotiations/:dealId" element={<DealRoom />} />
            <Route path="news" element={<Suspense fallback={<LazyFallback />}><NewsSignals /></Suspense>} />
            <Route path="vendors" element={<Suspense fallback={<LazyFallback />}><Vendors /></Suspense>} />
            <Route path="stakeholders" element={<Suspense fallback={<LazyFallback />}><Stakeholders /></Suspense>} />
            <Route path="battle-cards" element={<Suspense fallback={<LazyFallback />}><BattleCardPage /></Suspense>} />
            <Route path="wargame" element={<Suspense fallback={<LazyFallback />}><WarGameHome /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<LazyFallback />}><SettingsPage /></Suspense>} />

            {/* ── Legacy routes — reachable, unlinked ── */}
            <Route path="war-room" element={<Suspense fallback={<LazyFallback />}><WarRoom /></Suspense>} />
            <Route path="entities" element={<Navigate to="/vendors" replace />} />
            <Route path="dossiers" element={<Suspense fallback={<LazyFallback />}><Dossiers /></Suspense>} />
            <Route path="dossiers/:id" element={<Suspense fallback={<LazyFallback />}><Dossiers /></Suspense>} />
            <Route path="signals" element={<Suspense fallback={<LazyFallback />}><Signals /></Suspense>} />
            <Route path="people" element={<Suspense fallback={<LazyFallback />}><People /></Suspense>} />
            <Route path="pipeline" element={<Suspense fallback={<LazyFallback />}><Pipeline /></Suspense>} />
            <Route path="notes" element={<Suspense fallback={<LazyFallback />}><Notes /></Suspense>} />
            <Route path="deals/:id" element={<Suspense fallback={<LazyFallback />}><PreSalesDeal /></Suspense>} />
            <Route path="ecosystem" element={<Suspense fallback={<LazyFallback />}><Ecosystem /></Suspense>} />
            <Route path="digests" element={<Suspense fallback={<LazyFallback />}><Digests /></Suspense>} />
            <Route path="chat" element={<Suspense fallback={<LazyFallback />}><Chat /></Suspense>} />
            <Route path="battle-cards/legacy" element={<Suspense fallback={<LazyFallback />}><BattleCardsLegacy /></Suspense>} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
    </>
  )
}
