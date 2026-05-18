import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn, type Tone, TONE_HEX } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number | string
  sub?: string
  tone?: Tone
  /** Numeric delta. Sign determines direction unless `direction` overrides. */
  delta?: { value: number; direction?: 'up' | 'down' | 'flat'; label?: string; positive?: 'up' | 'down' }
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number | string }>
  className?: string
  onClick?: () => void
  /** Use display font + larger size for hero stat moments (e.g. CM headline). */
  size?: 'md' | 'lg' | 'xl'
}

export function StatCard({ label, value, sub, tone = 'neutral', delta, icon: Icon, className, onClick, size = 'md' }: StatCardProps) {
  const interactive = !!onClick
  const valueClass = size === 'xl' ? 'text-stat-xl' : size === 'lg' ? 'text-stat-lg' : 'text-stat'

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative bg-white ring-1 ring-tdds-200 rounded-md p-5 overflow-hidden',
        'transition-all duration-150 ease-tdds',
        interactive && 'cursor-pointer hover:ring-tdds-300 hover:shadow-sm',
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute left-0 top-3 bottom-3 w-[2px] rounded-r-full"
        style={{ background: TONE_HEX[tone] }}
      />

      <div className="flex items-start justify-between mb-3">
        <div className="eyebrow">{label}</div>
        {Icon && <Icon className="w-4 h-4 text-tdds-400" strokeWidth={1.75} />}
      </div>

      <div className="flex items-baseline gap-3 flex-wrap">
        <span className={cn('font-display text-tdds-900 tabular-nums', valueClass)}>{value}</span>
        {delta && <DeltaPill {...delta} />}
      </div>

      {sub && <div className="text-xs text-tdds-500 mt-2 font-medium">{sub}</div>}
    </div>
  )
}

function DeltaPill({ value, direction, label, positive = 'up' }: { value: number; direction?: 'up' | 'down' | 'flat'; label?: string; positive?: 'up' | 'down' }) {
  const dir = direction ?? (value > 0 ? 'up' : value < 0 ? 'down' : 'flat')
  const Icon = dir === 'up' ? ArrowUpRight : dir === 'down' ? ArrowDownRight : Minus
  const isGood = dir === 'flat' ? false : (positive === 'up' ? dir === 'up' : dir === 'down')
  const color = dir === 'flat' ? 'text-tdds-500' : isGood ? 'text-success' : 'text-critical'
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums', color)}>
      <Icon className="w-3 h-3" strokeWidth={2.25} />
      {Math.abs(value)}{label ? ` ${label}` : ''}
    </span>
  )
}
