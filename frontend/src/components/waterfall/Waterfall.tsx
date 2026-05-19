/**
 * P&L Waterfall — Pixel 10 cycle.
 *
 * True stepped waterfall: every bar starts where the previous left off, with
 * up-steps for credits/revenue and down-steps for costs, ending in the
 * total CM column. Two side-by-side charts:
 *
 *   - Baseline (gray) — what the vendor proposal lands at as-received
 *   - Counter-offer (magenta) — where the levers in play put us
 *
 * Each step shows its delta. Hovering a row in either chart highlights the
 * paired lever component.
 */

import { memo, useMemo } from 'react'
import type { WaterfallComponent } from '@/lib/demo/pixel10'
import { cn, formatMoney } from '@/lib/utils'

interface WaterfallProps {
  components: WaterfallComponent[]
  baselineCm: number
  proposedCm: number
  targetCm: number
  highlightLeverId?: string | null
  onRowHover?: (leverId: string | null) => void
}

export const Waterfall = memo(WaterfallImpl)

function WaterfallImpl({ components, baselineCm, proposedCm, highlightLeverId, onRowHover }: WaterfallProps) {
  const impact = proposedCm - baselineCm

  // Build the baseline + counter-offer step series. Order matters: P&L stack.
  // Revenue first, then buying cost, then credits, then promos, etc.
  const ordered = useMemo(() => orderForWaterfall(components), [components])

  return (
    <div>
      {/* ── CM journey strip ─────────────────────────────────── */}
      <CmJourney baselineCm={baselineCm} proposedCm={proposedCm} impact={impact} />

      {/* ── Two stepped waterfalls side-by-side ──────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <SteppedWaterfall
          title="Vendor proposal — as received"
          tone="gray"
          components={ordered}
          finalCm={ordered.reduce((s, c) => s + c.baseline, 0)}
          variant="baseline"
          highlightLeverId={highlightLeverId}
          onRowHover={onRowHover}
        />
        <SteppedWaterfall
          title="With our counter-offer"
          tone="magenta"
          components={ordered}
          finalCm={ordered.reduce((s, c) => s + c.proposed, 0)}
          variant="proposed"
          highlightLeverId={highlightLeverId}
          onRowHover={onRowHover}
        />
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────
// CM journey strip — unchanged from before; gives the headline
// "+X.X negotiation impact" before the chart detail.
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
        <div
          className="absolute inset-y-0 left-0 bg-tdds-300 transition-all duration-300 ease-tdds"
          style={{ width: `${baselinePct}%` }}
        >
          <div className="absolute inset-y-0 right-3 flex items-center text-[11px] font-semibold text-tdds-800 tabular-nums whitespace-nowrap">
            {formatMoney(baselineCm * 1_000_000, { decimals: 1 })} baseline
          </div>
        </div>
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
// Stepped waterfall — true cascading chart
// ───────────────────────────────────────────────────────────

function SteppedWaterfall({
  title, tone, components, finalCm, variant, highlightLeverId, onRowHover,
}: {
  title: string
  tone: 'gray' | 'magenta'
  components: WaterfallComponent[]
  finalCm: number
  variant: 'baseline' | 'proposed'
  highlightLeverId?: string | null
  onRowHover?: (leverId: string | null) => void
}) {
  // Compute running totals to position each floating bar.
  // For revenue (first), we use it as the starting positive column.
  // For each subsequent step, the bar floats from previous total to new total.
  type Step = {
    label: string
    leverId?: string
    value: number       // signed delta at this step
    runningBefore: number
    runningAfter: number
    isStart: boolean
    isEnd: boolean
  }

  const steps: Step[] = []
  let running = 0
  for (let i = 0; i < components.length; i++) {
    const c = components[i]
    const v = variant === 'baseline' ? c.baseline : c.proposed
    steps.push({
      label: c.label,
      leverId: c.leverId,
      value: v,
      runningBefore: running,
      runningAfter: running + v,
      isStart: i === 0,
      isEnd: false,
    })
    running += v
  }
  // Final total column
  steps.push({
    label: 'Contribution margin',
    value: running,
    runningBefore: 0,
    runningAfter: running,
    isStart: false,
    isEnd: true,
  })

  // Y-axis: span from min running value to max running value
  const allYs = steps.flatMap(s => [s.runningBefore, s.runningAfter])
  const yMin = Math.min(0, ...allYs)
  const yMax = Math.max(...allYs)
  const yRange = yMax - yMin || 1

  const barColor = (s: Step) => {
    if (s.isEnd) return tone === 'gray' ? 'bg-tdds-700' : 'bg-magenta-600'
    if (s.isStart) return tone === 'gray' ? 'bg-tdds-500' : 'bg-magenta-500'
    // Positive (up-step) = lighter; negative (down-step) = striped/darker tone
    if (s.value >= 0) return tone === 'gray' ? 'bg-tdds-400' : 'bg-magenta-400'
    return tone === 'gray' ? 'bg-tdds-300 ring-1 ring-tdds-400 ring-inset' : 'bg-magenta-200 ring-1 ring-magenta-400 ring-inset'
  }

  const accentText = tone === 'gray' ? 'text-tdds-700' : 'text-magenta-600'

  // Chart geometry
  const CHART_HEIGHT = 220
  const yPct = (v: number) => ((yMax - v) / yRange) * 100 // 0 at top, 100 at bottom

  return (
    <div className="bg-tdds-50/50 rounded-md ring-1 ring-tdds-200 p-4">
      <div className="flex items-baseline justify-between mb-3">
        <div className="font-display font-bold text-tdds-900 text-[13px] tracking-tight">{title}</div>
        <div className={cn('font-display font-extrabold text-[18px] tabular-nums tracking-tight', accentText)}>
          {formatMoney(finalCm * 1_000_000, { decimals: 1 })}
        </div>
      </div>

      {/* Chart body */}
      <div
        className="relative"
        style={{ height: CHART_HEIGHT }}
      >
        {/* Zero baseline */}
        <div
          className="absolute left-0 right-0 border-t border-tdds-300 z-0"
          style={{ top: `${yPct(0)}%` }}
        >
          <span className="absolute -top-3.5 right-0 text-[9px] font-bold uppercase tracking-wider text-tdds-400">$0</span>
        </div>

        {/* Bars row */}
        <div className="absolute inset-0 flex items-stretch gap-px">
          {steps.map((s, i) => {
            const top = s.isEnd ? yPct(Math.max(0, s.runningAfter)) : yPct(Math.max(s.runningBefore, s.runningAfter))
            const bottom = s.isEnd ? yPct(Math.min(0, s.runningAfter)) : yPct(Math.min(s.runningBefore, s.runningAfter))
            const height = Math.abs(bottom - top)
            const highlighted = highlightLeverId && s.leverId === highlightLeverId
            return (
              <div
                key={i}
                className="flex-1 relative min-w-0 cursor-default"
                onMouseEnter={() => s.leverId && onRowHover?.(s.leverId)}
                onMouseLeave={() => s.leverId && onRowHover?.(null)}
                title={`${s.label}: ${formatMoney(s.value * 1_000_000, { sign: s.value > 0, decimals: 1 })}`}
              >
                {/* The bar itself */}
                <div
                  className={cn(
                    'absolute left-1 right-1 rounded-[2px] transition-all duration-300',
                    barColor(s),
                    highlighted && 'ring-2 ring-magenta-500 ring-offset-1',
                  )}
                  style={{ top: `${top}%`, height: `${height}%` }}
                />

                {/* Connector dashed line to next bar's start — only for non-end bars */}
                {!s.isEnd && i < steps.length - 1 && (
                  <div
                    className="absolute right-0 border-t border-dashed border-tdds-300 z-10"
                    style={{
                      top: `${yPct(s.runningAfter)}%`,
                      width: '8px',
                      transform: 'translateX(50%)',
                    }}
                  />
                )}

                {/* Delta label */}
                <div
                  className={cn(
                    'absolute left-0 right-0 text-center text-[10px] font-bold tabular-nums whitespace-nowrap',
                    s.value >= 0 ? (tone === 'gray' ? 'text-tdds-900' : 'text-magenta-700') : 'text-critical',
                  )}
                  style={{ top: `calc(${top}% - 14px)` }}
                >
                  {s.isEnd ? '' : (s.value > 0 ? '+' : '') + formatMoney(s.value * 1_000_000, { decimals: 1 })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex items-start gap-px mt-1">
        {steps.map((s, i) => (
          <div key={i} className="flex-1 min-w-0 text-center">
            <div className={cn(
              'text-[9px] font-semibold leading-tight px-0.5',
              s.isEnd ? 'text-tdds-900' : 'text-tdds-600',
            )}>
              {s.label.replace(' & ', ' & ').split(' ').map((w, wi) => (
                <span key={wi} className="inline-block">{w}{wi < s.label.split(' ').length - 1 ? ' ' : ''}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────

/**
 * Re-order P&L components so the waterfall reads naturally:
 *   Revenue → Buying Cost → credits → promos → CM
 * Keeps every input component in place; just sorts by P&L stack convention.
 */
function orderForWaterfall(components: WaterfallComponent[]): WaterfallComponent[] {
  const priority: Record<string, number> = {
    revenue: 0,
    buy_cost: 1,
    volume_inc: 2,
    mdf: 3,
    reclamation: 4,
    promos: 5,
    promo_support: 6,
  }
  return [...components].sort((a, b) => (priority[a.id] ?? 99) - (priority[b.id] ?? 99))
}
