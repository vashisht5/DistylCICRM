import { cn } from '@/lib/utils'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
  meta?: React.ReactNode  // small metadata row under the title (chips, mono IDs, timestamps)
  className?: string
}

export function PageHeader({ eyebrow, title, description, meta, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex items-end justify-between gap-6 pb-4 mb-6 border-b border-tdds-200', className)}>
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
        <h1 className="font-display text-3xl text-tdds-900 leading-tight tracking-tight font-bold">{title}</h1>
        {meta && <div className="flex items-center gap-3 mt-2 text-xs text-tdds-500 font-medium">{meta}</div>}
        {description && (
          <p className="text-sm text-tdds-500 mt-2 max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  )
}
