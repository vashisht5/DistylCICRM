/**
 * Settings — minimal themed shell.
 *
 * Paper prototype: settings exist only to confirm the design language is
 * complete. Nothing actually persists.
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { Bell, Check, Database, Lock, User } from 'lucide-react'
import { PageHeader, Card, Button, Badge } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const { user, role } = useAuth()
  const [notifications, setNotifications] = useState(true)
  const [autoBrief, setAutoBrief] = useState(true)

  return (
    <div className="px-10 py-8 max-w-[900px] mx-auto">
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Workspace preferences for the Procurement Co-Pilot prototype."
      />

      <div className="space-y-6">
        {/* Account */}
        <Card>
          <div className="px-5 py-3 border-b border-tdds-200 flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-tdds-500" />
            <div className="eyebrow">Account</div>
          </div>
          <div className="p-5 space-y-3">
            <Row label="Name" value={user?.name ?? '—'} />
            <Row label="Email" value={user?.email ?? '—'} />
            <Row label="Role" value={<Badge tone="brand" variant="dot" uppercase>{role ?? '—'}</Badge>} />
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <div className="px-5 py-3 border-b border-tdds-200 flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-tdds-500" />
            <div className="eyebrow">Notifications</div>
          </div>
          <div className="p-5 space-y-3">
            <Toggle
              label="Daily morning brief"
              description="Summary of overnight signals, ranked by impact on active cycles."
              checked={autoBrief}
              onChange={v => { setAutoBrief(v); toast.success(`Daily brief ${v ? 'enabled' : 'disabled'}`) }}
            />
            <Toggle
              label="High-priority signal alerts"
              description="Push notification when a critical or high-bearing signal hits any active vendor."
              checked={notifications}
              onChange={v => { setNotifications(v); toast.success(`Signal alerts ${v ? 'enabled' : 'disabled'}`) }}
            />
          </div>
        </Card>

        {/* Data */}
        <Card>
          <div className="px-5 py-3 border-b border-tdds-200 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-tdds-500" />
            <div className="eyebrow">Data sources</div>
          </div>
          <div className="p-5 space-y-2.5">
            {[
              { name: 'Bloomberg news feed', status: 'connected' },
              { name: 'Vendor proposal vault', status: 'connected' },
              { name: 'EIP (vendor pricing)', status: 'planned' },
              { name: 'Sell-through history (Amdocs)', status: 'pending-approval' },
            ].map(d => (
              <div key={d.name} className="flex items-center justify-between text-[13px]">
                <span className="text-tdds-700 font-medium">{d.name}</span>
                <Badge
                  tone={d.status === 'connected' ? 'success' : d.status === 'planned' ? 'monitor' : 'high'}
                  variant="dot"
                  uppercase
                >
                  {d.status.replace(/-/g, ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Security */}
        <Card>
          <div className="px-5 py-3 border-b border-tdds-200 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-tdds-500" />
            <div className="eyebrow">Security</div>
          </div>
          <div className="p-5 flex items-baseline justify-between">
            <div className="text-[13px] text-tdds-700 leading-relaxed max-w-md">
              All workspace activity is logged and retained per internal procurement policy.
            </div>
            <Button variant="secondary" size="md" icon={Check} onClick={() => toast.info('Audit log preview coming next sprint')}>View audit log</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between text-[13px]">
      <span className="text-tdds-500 font-medium">{label}</span>
      <span className="text-tdds-900 font-semibold">{value}</span>
    </div>
  )
}

function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-[13px] font-semibold text-tdds-900">{label}</div>
        <div className="text-[12px] text-tdds-500 mt-0.5 leading-snug">{description}</div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-10 h-[22px] rounded-full shrink-0 transition-colors duration-150 ring-1 ring-inset',
          checked ? 'bg-magenta-500 ring-magenta-600' : 'bg-tdds-200 ring-tdds-300',
        )}
        aria-label={label}
      >
        <span
          aria-hidden
          className={cn(
            'absolute top-[2px] w-[16px] h-[16px] rounded-full bg-white shadow-sm transition-[left] duration-150 ease-tdds',
            checked ? 'left-[21px]' : 'left-[2px]',
          )}
        />
      </button>
    </div>
  )
}
