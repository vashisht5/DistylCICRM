import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import WarRoom from '@/pages/WarRoom'
import NewsFeed from '@/pages/NewsFeed'
import Entities from '@/pages/Entities'
import Dossiers from '@/pages/Dossiers'
import Signals from '@/pages/Signals'
import People from '@/pages/People'
import Pipeline from '@/pages/Pipeline'
import Ecosystem from '@/pages/Ecosystem'
import BattleCards from '@/pages/BattleCards'
import Digests from '@/pages/Digests'
import Chat from '@/pages/Chat'
import Settings from '@/pages/Settings'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  )
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
            <Route index element={<Navigate to="/war-room" replace />} />
            <Route path="war-room" element={<WarRoom />} />
            <Route path="news" element={<NewsFeed />} />
            <Route path="entities" element={<Entities />} />
            <Route path="dossiers" element={<Dossiers />} />
            <Route path="dossiers/:id" element={<Dossiers />} />
            <Route path="signals" element={<Signals />} />
            <Route path="people" element={<People />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="ecosystem" element={<Ecosystem />} />
            <Route path="battle-cards" element={<BattleCards />} />
            <Route path="digests" element={<Digests />} />
            <Route path="chat" element={<Chat />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </>
  )
}
