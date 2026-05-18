import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  Handshake, Newspaper, Building2, UserSquare, Layers, Dices, Settings,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { TMobileMark } from '@/components/ui/TMobileMark'

// Negotiation-focused IA — 7 nav items (Deal Room is a child route, not in nav).
const NAV: Array<{ to: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>; label: string; group: 'work' | 'intel' | 'tools' }> = [
  { to: '/negotiations',  icon: Handshake,    label: 'Negotiations',  group: 'work' },
  { to: '/news',          icon: Newspaper,    label: 'News & Signals', group: 'work' },
  { to: '/vendors',       icon: Building2,    label: 'Vendors',       group: 'intel' },
  { to: '/stakeholders',  icon: UserSquare,   label: 'Stakeholders',  group: 'intel' },
  { to: '/battle-cards',  icon: Layers,       label: 'Battle Cards',  group: 'intel' },
  { to: '/wargame',       icon: Dices,        label: 'War Game',      group: 'tools' },
  { to: '/settings',      icon: Settings,     label: 'Settings',      group: 'tools' },
]

const GROUP_LABEL: Record<string, string> = {
  work: 'Active work',
  intel: 'Intelligence',
  tools: 'Tools',
}

export default function Layout() {
  const { user, role } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await fetch('/auth/logout', { method: 'POST' })
    navigate('/login')
    window.location.reload()
  }

  const groups = ['work', 'intel', 'tools'] as const
  const grouped = groups.map(g => ({ g, items: NAV.filter(n => n.group === g) }))

  return (
    <div className="flex h-screen bg-tdds-100 overflow-hidden">
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="w-60 bg-white border-r border-tdds-200 flex flex-col shrink-0">
        {/* Brand lockup — single magenta moment: the T mark */}
        <div className="h-14 flex items-center px-5 border-b border-tdds-200">
          <div className="flex items-center gap-2.5">
            <TMobileMark size={28} />
            <div className="leading-tight">
              <div className="font-display text-[13px] font-bold text-tdds-900 tracking-tight">Procurement Co-Pilot</div>
              <div className="text-[10px] text-tdds-400 font-semibold tracking-wider uppercase mt-0.5">T-Mobile · Devices</div>
            </div>
          </div>
        </div>

        {/* Nav — grouped, with thin magenta active rail */}
        <nav className="flex-1 px-2 py-4 overflow-y-auto">
          {grouped.map(({ g, items }, gi) => (
            <div key={g} className={cn(gi > 0 && 'mt-5')}>
              <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-tdds-400">
                {GROUP_LABEL[g]}
              </div>
              <div className="space-y-px">
                {items.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      cn(
                        'relative flex items-center gap-2.5 pl-3 pr-2.5 py-1.5 rounded-sm text-[13px] transition-colors duration-100',
                        isActive
                          ? 'bg-tdds-100 text-tdds-900 font-semibold'
                          : 'text-tdds-600 hover:bg-tdds-50 hover:text-tdds-900',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-magenta-500 rounded-r-full" />
                        )}
                        <Icon
                          className={cn('w-[15px] h-[15px] shrink-0', isActive ? 'text-tdds-900' : 'text-tdds-400')}
                          strokeWidth={isActive ? 2 : 1.75}
                        />
                        <span className="flex-1">{label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User block */}
        <div className="border-t border-tdds-200 px-3 py-3">
          <div className="flex items-center gap-2.5 mb-2">
            {user?.picture_url ? (
              <img src={user.picture_url} alt="" className="w-7 h-7 rounded-full" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-tdds-900 grid place-items-center text-[11px] font-bold text-white">
                {(user?.name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-tdds-900 truncate leading-tight">{user?.name ?? user?.email}</div>
              {role && (
                <div className="text-[10px] font-semibold tracking-wider uppercase text-tdds-400 mt-0.5">{role}</div>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-[11px] text-tdds-500 hover:text-tdds-900 transition-colors w-full font-medium"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-tdds-100">
        <Outlet />
      </main>
    </div>
  )
}
