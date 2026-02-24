import { useState } from 'react'
import { Settings as SettingsIcon, Users, ExternalLink, Check, AlertCircle } from 'lucide-react'
import { useAdminUsers, useUpdateUserRole } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { cn, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

const ROLES = ['admin', 'analyst', 'sales', 'viewer']
const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  analyst: 'bg-purple-100 text-purple-700',
  sales: 'bg-blue-100 text-blue-700',
  viewer: 'bg-gray-100 text-gray-600',
}

function IntegrationCard({
  name, description, status, action, actionLabel, href
}: {
  name: string; description: string; status: 'connected' | 'not_configured' | 'optional'
  action?: () => void; actionLabel?: string; href?: string
}) {
  return (
    <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{name}</span>
          {status === 'connected' && <Check className="w-3.5 h-3.5 text-green-500" />}
          {status === 'not_configured' && <AlertCircle className="w-3.5 h-3.5 text-orange-400" />}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn(
          'text-xs px-2 py-0.5 rounded border font-medium',
          status === 'connected' ? 'bg-green-100 text-green-700 border-green-200' :
          status === 'not_configured' ? 'bg-orange-100 text-orange-700 border-orange-200' :
          'bg-gray-100 text-gray-500 border-gray-200'
        )}>
          {status === 'connected' ? 'Connected' : status === 'not_configured' ? 'Not configured' : 'Optional'}
        </span>
        {href && (
          <a href={href} target="_blank" rel="noreferrer"
            className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5">
            Configure <ExternalLink className="w-3 h-3" />
          </a>
        )}
        {action && (
          <button onClick={action} className="text-xs text-primary-600 hover:text-primary-700">{actionLabel}</button>
        )}
      </div>
    </div>
  )
}

function UsersTab() {
  const { data } = useAdminUsers()
  const updateRole = useUpdateUserRole()
  const users = data?.users ?? []

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <Users className="w-4 h-4" /> User Management
        </h2>
        <p className="text-xs text-gray-400">{users.length} users</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Login</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Change Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user: any) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{user.name || user.email}</div>
                  <div className="text-xs text-gray-400">{user.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs px-2 py-0.5 rounded font-medium', ROLE_COLORS[user.role] || ROLE_COLORS.viewer)}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{formatDate(user.last_login)}</td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={e => updateRole.mutate({ id: user.id, role: e.target.value }, {
                      onSuccess: () => toast.success(`${user.name || user.email} → ${e.target.value}`),
                    })}
                    className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">No users found</div>
        )}
      </div>
    </div>
  )
}

export default function Settings() {
  const { isAdmin } = useAuth()
  const [tab, setTab] = useState('integrations')

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <SettingsIcon className="w-5 h-5 text-primary-600" />
        Settings
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { id: 'integrations', label: 'Integrations' },
          { id: 'thresholds', label: 'Signal Thresholds' },
          ...(isAdmin ? [{ id: 'users', label: 'Users' }] : []),
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Integrations */}
      {tab === 'integrations' && (
        <div className="space-y-3 max-w-2xl">
          <IntegrationCard
            name="Google OAuth (Login)"
            description="Sign in with @distyl.ai Google accounts. Required for all users."
            status="not_configured"
            href="/auth/google"
          />
          <IntegrationCard
            name="Gmail Monitoring"
            description="Monitor your inbox for entity mentions and create signals automatically."
            status="not_configured"
            href="/auth/google/gmail"
          />
          <IntegrationCard
            name="Google Drive Sync"
            description="Scan watched folders for meeting notes and extract entity mentions."
            status="not_configured"
            href="/auth/google/drive"
          />
          <IntegrationCard
            name="Slack"
            description="Post signal alerts, digest, and support /intel slash commands."
            status="not_configured"
          />
          <IntegrationCard
            name="NewsAPI"
            description="Structured news from 80,000+ sources. Set NEWSAPI_KEY in environment."
            status="not_configured"
          />
          <IntegrationCard
            name="Perplexity"
            description="AI-synthesized latest news with citations. Set PERPLEXITY_API_KEY in environment."
            status="optional"
          />
          <IntegrationCard
            name="Claude (Anthropic)"
            description="Used for dossier generation, signal scoring, chat, and autonomy engine."
            status="connected"
          />
        </div>
      )}

      {/* Signal Thresholds */}
      {tab === 'thresholds' && (
        <div className="max-w-lg space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Signal Scoring Thresholds</h2>
            <div className="space-y-3">
              {[
                { label: 'Immediate Slack alert', key: 'immediate', value: 80, color: 'red' },
                { label: 'Batch notification (6h)', key: 'batch', value: 60, color: 'orange' },
                { label: 'DB only (no notification)', key: 'silent', value: 0, color: 'gray' },
              ].map(item => (
                <div key={item.key} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                  <span className={cn('text-xs font-bold px-2 py-0.5 rounded border',
                    item.color === 'red' ? 'bg-red-50 text-red-600 border-red-200' :
                    item.color === 'orange' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                    'bg-gray-50 text-gray-500 border-gray-200'
                  )}>
                    {item.value > 0 ? `≥ ${item.value}` : `< 60`}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400">Thresholds are currently fixed. Configurable per-user thresholds coming in a future update.</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">Autonomy Engine</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Run frequency</span>
                <span className="font-medium">Every 30 minutes</span>
              </div>
              <div className="flex justify-between">
                <span>News refresh</span>
                <span className="font-medium">Every 2 hours</span>
              </div>
              <div className="flex justify-between">
                <span>Signal sweep</span>
                <span className="font-medium">Every 6 hours</span>
              </div>
              <div className="flex justify-between">
                <span>People sweep</span>
                <span className="font-medium">Daily 7am</span>
              </div>
              <div className="flex justify-between">
                <span>Digest</span>
                <span className="font-medium">Bi-weekly Monday 8am</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users (admin only) */}
      {tab === 'users' && isAdmin && <UsersTab />}
    </div>
  )
}
