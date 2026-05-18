import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'section' | 'article'
  interactive?: boolean
  emphasis?: 'flat' | 'flagged'  // flagged = magenta wash + magenta border (TDDS "accessed" state)
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function Card({ children, className, as: As = 'div', interactive, emphasis = 'flat', onClick, onMouseEnter, onMouseLeave }: CardProps) {
  return (
    <As
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        'bg-white rounded-md',
        emphasis === 'flat' && 'ring-1 ring-tdds-200',
        emphasis === 'flagged' && 'ring-1 ring-magenta-500 bg-magenta-50',
        (interactive || onClick) && 'transition-all duration-150 ease-tdds hover:ring-tdds-300 hover:shadow-sm cursor-pointer',
        className,
      )}
    >
      {children}
    </As>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-tdds-200', className)}>
      {children}
    </div>
  )
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-5', className)}>{children}</div>
}

export function CardTitle({ children, className, eyebrow }: { children: React.ReactNode; className?: string; eyebrow?: string }) {
  return (
    <div className={className}>
      {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
      <h2 className="font-display text-base font-bold text-tdds-900 tracking-tight">{children}</h2>
    </div>
  )
}
