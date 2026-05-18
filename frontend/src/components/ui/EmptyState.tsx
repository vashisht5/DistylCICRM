import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number | string }>
  action?: React.ReactNode
  className?: string
  variant?: 'inline' | 'editorial'
}

export function EmptyState({ title, description, icon: Icon, action, className, variant = 'inline' }: EmptyStateProps) {
  if (variant === 'editorial') {
    return (
      <div className={cn('flex flex-col items-center text-center py-16 px-6 max-w-md mx-auto', className)}>
        {Icon && (
          <div className="w-12 h-12 rounded-md bg-tdds-100 flex items-center justify-center mb-5 ring-1 ring-tdds-200">
            <Icon className="w-5 h-5 text-tdds-500" strokeWidth={1.5} />
          </div>
        )}
        <h3 className="font-display text-2xl text-tdds-900 mb-2 tracking-tight">{title}</h3>
        {description && <p className="text-sm text-tdds-500 mb-6 max-w-sm">{description}</p>}
        {action}
      </div>
    )
  }
  return (
    <div className={cn('flex flex-col items-center text-center py-10 px-6', className)}>
      {Icon && <Icon className="w-6 h-6 text-tdds-400 mb-3" strokeWidth={1.5} />}
      <div className="text-sm font-semibold text-tdds-800">{title}</div>
      {description && <div className="text-xs text-tdds-500 mt-1 max-w-xs">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
