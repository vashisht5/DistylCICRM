import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  Shield, Newspaper, Building2, FileText, Zap, Users,
  GitBranch, Network, Swords, BookOpen, MessageSquare, Settings,
  Bell, LogOut, ChevronRight
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSignalStats } from '@/lib/api'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/war-room', icon: Shield, label: 'War Room' },
  { to: '/news', icon: Newspaper, label: 'News Feed' },
  { to: '/entities', icon: Building2, label: 'Entities' },
  { to: '/dossiers', icon: FileText, label: 'Dossiers' },
  { to: '/signals', icon: Zap, label: 'Signals' },
  { to: '/people', icon: Users, label: 'People' },
  { to: '/pipeline', icon: GitBranch, label: 'Pipeline' },
  { to: '/ecosystem', icon: Network, label: 'Ecosystem' },
  { to: '/battle-cards', icon: Swords, label: 'Battle Cards' },
  { to: '/digests', icon: BookOpen, label: 'Digests' },
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

function RoleBadge({ role }: { role?: string }) {
  const colors: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    analyst: 'bg-purple-100 text-purple-700',
    sales: 'bg-blue-100 text-blue-700',
    viewer: 'bg-gray-100 text-gray-600',
  }
  if (!role) return null
  return (
    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide', colors[role] || colors.viewer)}>
      {role}
    </span>
  )
}

export default function Layout() {
  const { user, role } = useAuth()
  const { data: stats } = useSignalStats()
  const navigate = useNavigate()
  const newSignals = stats?.total_new ?? 0

  async function handleLogout() {
    await fetch('/auth/logout', { method: 'POST' })
    navigate('/login')
    window.location.reload()
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900 leading-none">Distyl Intel</div>
              <div className="text-[10px] text-gray-400 leading-none mt-0.5">Competitive Intelligence</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-primary-600' : 'text-gray-400')} />
                  <span className="flex-1">{label}</span>
                  {label === 'Signals' && newSignals > 0 && (
                    <span className="bg-primary-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {newSignals > 99 ? '99+' : newSignals}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3 h-3 text-primary-400" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center gap-2 mb-2">
            {user?.picture_url ? (
              <img src={user.picture_url} alt="" className="w-7 h-7 rounded-full" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-900 truncate">{user?.name ?? user?.email}</div>
              <RoleBadge role={role} />
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors w-full"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
