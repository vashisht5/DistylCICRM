/**
 * P&L Waterfall — Pixel 10 cycle.
 *
 * Shows each P&L component as a horizontal bar centered on a zero line.
 * Baseline value is rendered in TDDS grey; counter-offer overlays in
 * magenta. A green "negotiation impact" rail on the left totals the
 * captured upside (per Apr 21 Bain planning session, onboarding doc § 4.2).
 *
 * Pure HTML + Tailwind. No SVG gymnastics. Easy to evolve as Phase D
 * adds interactivity.
 */

import { memo, useMemo } from 'react'
import type { WaterfallComponent } from '@/lib/demo/pixel10'
import { cn, formatMoney } from '@/lib/utils'

interface WaterfallProps {
  components: WaterfallComponent[]
  baselineCm: number
  proposedCm: number
  targetCm: number
  /** Lever id currently hovered/focused — highlights its component row. */
  highlightLeverId?: string | null
  onRowHover?: (leverId: string | null) => void
}

export const Waterfall = memo(WaterfallImpl)

function WaterfallImpl({ components, baselineCm, proposedCm, highlightLeverId, onRowHover }: WaterfallProps) {
  const impact = proposedCm - baselineCm

  // Common bar-width scale — single max across all components for consistent comparison
  const maxAbs = useMemo(() => Math.max(
    ...components.flatMap(c => [Math.abs(c.baseline), Math.abs(c.proposed)]),
  ), [components])

  return (
    <div className="px-1">
      {/* ── Top: CM journey strip ─────────────────────── */}
      <CmJourney baselineCm={baselineCm} proposedCm={proposedCm} impact={impact} />

      {/* ── Lever-by-lever waterfall ─────────────────── */}
      <div className="flex items-stretch mt-6 gap-4">
        <ImpactRail impactM={impact} />

        <div className="flex-1 min-w-0 py-1">
          {components.map(c => (
            <WaterfallRow
              key={c.id}
              component={c}
              maxAbs={maxAbs}
              highlighted={!!(highlightLeverId && c.leverId === highlightLeverId)}
              onHoverChange={hovered => onRowHover?.(hovered ? c.leverId ?? null : null)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────
// CM journey strip — single horizontal bar: baseline (grey)
// + negotiation impact (green) = counter-offer total
// ───────────────────────────────────────────────────────────

function CmJourney({ baselineCm, proposedCm, impact }: { baselineCm: number; proposedCm: number; impact: number }) {
  const baselinePct = proposedCm > 0 ? (baselineCm / proposedCm) * 100 : 0
  const impactPct = 100 - baselinePct

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2.5">
        <div className="eyebrow">Contribution margin journey</div>
        <div className="text-[11px] text-tdds-500 font-medium tabular-nums">
          <span className="text-tdds-900 font-semibold">{formatMoney(baselineCm * 1_000_000, { decimals: 1 })}</span>
          <span className="mx-1.5 text-tdds-300">+</span>
          <span className="text-success font-semibold">{formatMoney(impact * 1_000_000, { sign: true, decimals: 1 })}</span>
          <span className="mx-1.5 text-tdds-300">=</span>
          <span className="text-magenta-600 font-semibold">{formatMoney(proposedCm * 1_000_000, { decimals: 1 })}</span>
        </div>
      </div>
      <div className="relative h-10 rounded-sm overflow-hidden ring-1 ring-tdds-200 bg-tdds-50">
        {/* Baseline — light grey */}
        <div
          className="absolute inset-y-0 left-0 bg-tdds-300 transition-all duration-300 ease-tdds"
          style={{ width: `${baselinePct}%` }}
        >
          <div className="absolute inset-y-0 right-3 flex items-center text-[11px] font-semibold text-tdds-800 tabular-nums whitespace-nowrap">
            {formatMoney(baselineCm * 1_000_000, { decimals: 1 })} baseline
          </div>
        </div>
        {/* Negotiation impact — charcoal; green is reserved for the small delta numbers only */}
        <div
          className="absolute inset-y-0 bg-tdds-900 transition-all duration-300 ease-tdds"
          style={{ left: `${baselinePct}%`, width: `${impactPct}%` }}
        >
          {impactPct > 6 && (
            <div className="absolute inset-y-0 left-3 flex items-center gap-1.5 text-[11px] font-semibold tabular-nums whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              <span className="text-white">{formatMoney(impact * 1_000_000, { sign: true, decimals: 1 })} negotiation impact</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────
// Left green rail — "negotiation impact" callout
// ───────────────────────────────────────────────────────────

function ImpactRail({ impactM }: { impactM: number }) {
  return (
    <div className="w-[100px] shrink-0 flex flex-col">
      <div className="text-[9px] font-bold uppercase tracking-wider text-tdds-500 text-center leading-tight mb-1.5">
        Negotiation<br />impact
      </div>
      {/* TDDS pattern: charcoal panel with a thin green left accent that carries the semantic
         "positive impact" reading without flooding the layout with bright green. */}
      <div className="flex-1 relative bg-tdds-900 rounded-sm overflow-hidden min-h-[180px] flex items-center justify-center">
        <span className="absolute left-0 top-3 bottom-3 w-[3px] bg-success rounded-r-full" aria-hidden />
        <div className="text-center px-2">
          <div className="font-display text-white font-extrabold text-[26px] tabular-nums leading-none tracking-tight">
            {formatMoney(impactM * 1_000_000, { sign: true, decimals: 1 })}
          </div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-tdds-400 mt-1.5">
            captured
          </div>
        </div>
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────
// Single waterfall row
// ───────────────────────────────────────────────────────────

function WaterfallRow({
  component, maxAbs, highlighted, onHoverChange,
}: {
  component: WaterfallComponent
  maxAbs: number
  highlighted: boolean
  onHoverChange?: (hovered: boolean) => void
}) {
  const { label, baseline, proposed } = component
  const delta = proposed - baseline
  const isCost = baseline < 0
  // For costs, less-negative = improvement. For credits, more positive = improvement.
  const improved = isCost ? proposed > baseline : proposed > baseline
  const changed = Math.abs(delta) > 0.01

  // Bar widths — % of max abs, scaled to half-width (50%) since bars extend from center.
  const basePct = (Math.abs(baseline) / maxAbs) * 50
  const propPct = (Math.abs(proposed) / maxAbs) * 50
  const baselineSide: 'left' | 'right' = baseline < 0 ? 'left' : 'right'
  const proposedSide: 'left' | 'right' = proposed < 0 ? 'left' : 'right'

  return (
    <div
      className={cn(
        'flex items-center h-11 transition-colors rounded-sm',
        highlighted && 'bg-magenta-50/60',
      )}
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
    >
      {/* Label */}
      <div className={cn(
        'w-[180px] shrink-0 pl-3 pr-3 text-[12px] font-medium leading-tight',
        highlighted ? 'text-tdds-900' : 'text-tdds-700',
      )}>
        {label}
        {component.leverId && (
          <div className={cn('text-[10px] mt-0.5 font-normal', highlighted ? 'text-magenta-600' : 'text-tdds-400')}>
            lever active
          </div>
        )}
      </div>

      {/* Bar area */}
      <div className="flex-1 relative h-full min-w-[200px]">
        {/* zero line */}
        <div className="absolute left-1/2 top-2 bottom-2 w-px bg-tdds-200" />

        {/* baseline bar — grey, lower track */}
        <div
          className="absolute top-[18px] h-[8px] bg-tdds-300 rounded-[2px] transition-all duration-300"
          style={positionStyle(baselineSide, basePct)}
        />

        {/* counter-offer bar — magenta, upper track */}
        <div
          className={cn(
            'absolute top-[8px] h-[8px] rounded-[2px] transition-all duration-300 ease-tdds',
            highlighted ? 'bg-magenta-600' : 'bg-magenta-500',
          )}
          style={positionStyle(proposedSide, propPct)}
        />
      </div>

      {/* Right number column — baseline above, delta below */}
      <div className="w-[110px] shrink-0 pl-3 pr-3 text-right tabular-nums">
        <div className="text-[11px] text-tdds-500 leading-tight">
          {baseline >= 0 ? '+' : ''}{formatMoney(baseline * 1_000_000, { decimals: 1 })}
        </div>
        <div className={cn(
          'text-[12px] font-semibold leading-tight mt-0.5',
          !changed ? 'text-tdds-400' : improved ? 'text-success' : 'text-critical',
        )}>
          {!changed ? '—' : (delta > 0 ? '+' : '') + formatMoney(delta * 1_000_000, { decimals: 1 })}
        </div>
      </div>
    </div>
  )
}

function positionStyle(side: 'left' | 'right', widthPct: number): React.CSSProperties {
  if (side === 'left') return { right: '50%', width: `${widthPct}%` }
  return { left: '50%', width: `${widthPct}%` }
}
