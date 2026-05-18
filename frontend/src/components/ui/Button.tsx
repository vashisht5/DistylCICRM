import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number | string }>
  iconRight?: React.ComponentType<{ className?: string; strokeWidth?: number | string }>
}

// Primary = T-Mobile magenta. Secondary = white card with hairline. Ghost = no chrome.
const VARIANTS: Record<Variant, string> = {
  primary:   'bg-magenta-500 text-white hover:bg-magenta-600 active:bg-magenta-700',
  secondary: 'bg-white text-tdds-900 ring-1 ring-inset ring-tdds-300 hover:bg-tdds-50 hover:ring-tdds-400',
  ghost:     'text-tdds-700 hover:bg-tdds-100 hover:text-tdds-900',
  danger:    'bg-critical text-white hover:bg-critical/90',
}

const SIZES: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-[12px] gap-1 rounded-sm',
  md: 'h-9 px-3.5 text-[13px] gap-1.5 rounded-sm',
  lg: 'h-10 px-4 text-[14px] gap-2 rounded-md',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon: Icon, iconRight: IconRight, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-colors duration-150 ease-tdds',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} strokeWidth={1.85} />}
      {children}
      {IconRight && <IconRight className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} strokeWidth={1.85} />}
    </button>
  )
})
