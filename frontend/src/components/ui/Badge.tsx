import { cn, type Tone, TONE_HEX } from '@/lib/utils'

interface BadgeProps {
  tone?: Tone
  variant?: 'dot' | 'soft' | 'outline' | 'solid'
  size?: 'sm' | 'md'
  uppercase?: boolean
  children: React.ReactNode
  className?: string
}

const SOFT: Record<Tone, string> = {
  critical: 'text-critical bg-critical/8 ring-critical/20',
  high:     'text-warning bg-warning/10 ring-warning/25',
  medium:   'text-magenta-600 bg-magenta-50 ring-magenta-200',
  low:      'text-success bg-success/8 ring-success/20',
  monitor:  'text-tdds-500 bg-tdds-100 ring-tdds-200',
  neutral:  'text-tdds-600 bg-tdds-100 ring-tdds-200',
  brand:    'text-magenta-600 bg-magenta-50 ring-magenta-200',
  success:  'text-success bg-success/8 ring-success/20',
}

const OUTLINE: Record<Tone, string> = {
  critical: 'text-critical ring-critical/30',
  high:     'text-warning ring-warning/30',
  medium:   'text-magenta-600 ring-magenta-200',
  low:      'text-success ring-success/30',
  monitor:  'text-tdds-500 ring-tdds-200',
  neutral:  'text-tdds-600 ring-tdds-200',
  brand:    'text-magenta-600 ring-magenta-200',
  success:  'text-success ring-success/30',
}

const SOLID: Record<Tone, string> = {
  critical: 'bg-critical text-white',
  high:     'bg-warning text-white',
  medium:   'bg-magenta-500 text-white',
  low:      'bg-success text-white',
  monitor:  'bg-tdds-400 text-white',
  neutral:  'bg-tdds-600 text-white',
  brand:    'bg-magenta-500 text-white',
  success:  'bg-success text-white',
}

export function Badge({ tone = 'neutral', variant = 'dot', size = 'sm', uppercase, children, className }: BadgeProps) {
  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-[11px]'
    : 'px-2.5 py-1 text-xs'
  const upper = uppercase ? 'uppercase tracking-wider font-semibold' : 'font-medium'

  if (variant === 'dot') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-tdds-700', size === 'sm' ? 'text-[11px]' : 'text-xs', upper, className)}>
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: TONE_HEX[tone] }} />
        <span className={uppercase ? '' : 'capitalize'}>{children}</span>
      </span>
    )
  }
  if (variant === 'soft') {
    return (
      <span className={cn('inline-flex items-center rounded-sm ring-1 ring-inset', sizeClasses, upper, SOFT[tone], className)}>
        {children}
      </span>
    )
  }
  if (variant === 'outline') {
    return (
      <span className={cn('inline-flex items-center rounded-sm ring-1 ring-inset bg-white', sizeClasses, upper, OUTLINE[tone], className)}>
        {children}
      </span>
    )
  }
  return (
    <span className={cn('inline-flex items-center rounded-sm font-semibold', sizeClasses, upper, SOLID[tone], className)}>
      {children}
    </span>
  )
}
