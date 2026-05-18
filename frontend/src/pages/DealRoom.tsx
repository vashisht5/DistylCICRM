/**
 * Deal Room — Pixel 10 Q1 2026 negotiation workspace.
 *
 * The state model:
 *   - We keep the canonical `deal` (baseline + initial proposed values) frozen.
 *   - `leverValues[componentId] = currentProposedValue` is the working draft.
 *   - Sliders on lever cards mutate `leverValues`.
 *   - The waterfall + CM headline + impact rail all derive from this state.
 *
 * Counter-offer save just shows a toast — paper prototype, no backend.
 */

import { useParams, useNavigate, Link } from 'react-router-dom'
import { useMemo, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, Clock, Send, Sparkles, RotateCcw, Layers } from 'lucide-react'
import { PageHeader, Card, Button, Badge, EmptyState } from '@/components/ui'
import { Waterfall } from '@/components/waterfall/Waterfall'
import { MonteCarloModal } from '@/components/wargame/MonteCarloModal'
import { PIXEL_10, STATUS_LABEL, type Negotiation, type Lever } from '@/lib/demo/pixel10'
import { cn, formatMoney, formatRelative } from '@/lib/utils'

export default function DealRoom() {
  const { dealId } = useParams()
  const navigate = useNavigate()

  const deal: Negotiation | null = dealId === 'pixel-10-q1-2026' ? PIXEL_10 : null

  if (!deal) {
    return (
      <div className="px-10 py-8 max-w-[1400px] mx-auto">
        <Link to="/negotiations" className="text-[12px] text-tdds-500 hover:text-tdds-900 inline-flex items-center gap-1 mb-6">
          <ArrowLeft className="w-3 h-3" /> All negotiations
        </Link>
        <EmptyState
          variant="editorial"
          title="Deal Room not yet provisioned"
          description="This vendor's negotiation workspace is in setup. Open an active cycle to continue."
          action={<Button variant="primary" onClick={() => navigate('/negotiations/pixel-10-q1-2026')}>Open Pixel 10 cycle</Button>}
        />
      </div>
    )
  }

  return <PixelTenWorkspace deal={deal} />
}

// ────────────────────────────────────────────────────────────
// Workspace — state-driven, interactive
// ────────────────────────────────────────────────────────────

function PixelTenWorkspace({ deal }: { deal: Negotiation }) {
  const navigate = useNavigate()
  const [hoverLeverId, setHoverLeverId] = useState<string | null>(null)
  const [wargameOpen, setWargameOpen] = useState(false)

  // Working draft — keyed by component id (each lever moves one component).
  const initialValues = useMemo(() => {
    const m: Record<string, number> = {}
    for (const c of deal.components) m[c.id] = c.proposed
    return m
  }, [deal])

  const [values, setValues] = useState<Record<string, number>>(initialValues)

  const setLeverValue = useCallback((componentId: string, v: number) => {
    setValues(prev => ({ ...prev, [componentId]: v }))
  }, [])

  const resetToVendor = useCallback(() => {
    const reset: Record<string, number> = {}
    for (const c of deal.components) reset[c.id] = c.baseline
    setValues(reset)
    toast.info('Reset to vendor baseline', { description: 'All levers returned to as-received proposal.' })
  }, [deal])

  const resetToInitial = useCallback(() => {
    setValues(initialValues)
    toast.info('Reset to suggested counter-offer', { description: 'Recommended lever positions restored.' })
  }, [initialValues])

  const sendCounterOffer = useCallback(() => {
    const cm = computeCm(deal.components, values)
    toast.success(`Counter-offer drafted — CM ${formatMoney(cm * 1_000_000, { decimals: 1 })}`, {
      description: 'Counter-offer packaged for executive review. Routes to vendor after sign-off.',
    })
  }, [deal, values])

  // Derived: synthesize components with current proposed values for the chart
  const liveComponents = useMemo(
    () => deal.components.map(c => ({ ...c, proposed: values[c.id] ?? c.proposed })),
    [deal, values],
  )
  const baselineCm = useMemo(() => deal.components.reduce((s, c) => s + c.baseline, 0), [deal])
  const proposedCm = useMemo(() => computeCm(deal.components, values), [deal, values])
  const deltaM = proposedCm - baselineCm
  const remainingM = deal.targetCmM - proposedCm

  return (
    <div className="px-10 py-8 max-w-[1400px] mx-auto">
      <Link to="/negotiations" className="text-[12px] text-tdds-500 hover:text-tdds-900 inline-flex items-center gap-1 mb-6 font-medium">
        <ArrowLeft className="w-3 h-3" strokeWidth={2} /> All negotiations
      </Link>

      <PageHeader
        eyebrow={`${deal.vendor.name} · ${deal.cycle} Cycle`}
        title={deal.device}
        meta={
          <>
            <Badge tone="brand" variant="dot">{STATUS_LABEL[deal.status]}</Badge>
            <span className="text-tdds-300">·</span>
            <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{deal.daysToClose} days to close</span>
            <span className="text-tdds-300">·</span>
            <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />Updated {formatRelative(deal.lastTouchedAt)}</span>
            <span className="text-tdds-300">·</span>
            <span className="tabular-nums"><strong className="text-tdds-900 font-semibold">{deal.unitsM.toFixed(2)}M</strong> units</span>
          </>
        }
        actions={
          <>
            <Button variant="ghost" size="md" icon={RotateCcw} onClick={resetToInitial}>Reset</Button>
            <Button variant="secondary" size="md" icon={Layers} onClick={() => navigate('/battle-cards')}>Battle card</Button>
            <Button variant="secondary" size="md" icon={Sparkles} onClick={() => setWargameOpen(true)}>Run war game</Button>
            <Button variant="primary" size="md" icon={Send} onClick={sendCounterOffer}>Send counter-offer</Button>
          </>
        }
      />

      {/* ── Hero CM strip — live recalc ── */}
      <div className="bg-white rounded-md ring-1 ring-tdds-200 p-8 mb-8">
        <div className="eyebrow mb-4">Contribution Margin — Q1 2026 Pixel 10 cycle</div>
        <div className="flex items-end gap-8 lg:gap-12 flex-wrap">
          <CmFigure
            eyebrow="If we accept as-is"
            value={formatMoney(baselineCm * 1_000_000, { decimals: 1 })}
            sub={<button onClick={resetToVendor} className="text-tdds-500 hover:text-tdds-900 underline-offset-2 hover:underline">Show this in chart</button>}
          />

          <CmArrow delta={deltaM} />

          <CmFigure
            eyebrow="With our counter-offer"
            value={formatMoney(proposedCm * 1_000_000, { decimals: 1 })}
            sub={`Internal target: ${formatMoney(deal.targetCmM * 1_000_000, { decimals: 1 })}`}
            accent
          />

          {remainingM > 0.05 ? (
            <div className="ml-auto text-right">
              <div className="eyebrow mb-1.5">Unclaimed vs. target</div>
              <div className="text-[28px] font-display font-extrabold text-tdds-400 tabular-nums leading-none tracking-tight">
                {formatMoney(remainingM * 1_000_000, { decimals: 1 })}
              </div>
              <div className="text-[11px] text-tdds-500 mt-2 font-medium">Room to tighten</div>
            </div>
          ) : (
            <div className="ml-auto text-right">
              <div className="eyebrow mb-1.5 text-success">At or above target</div>
              <div className="text-[28px] font-display font-extrabold text-success tabular-nums leading-none tracking-tight">
                ✓
              </div>
              <div className="text-[11px] text-success mt-2 font-medium">Ready to send</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Waterfall ── */}
      <Card className="mb-8">
        <div className="px-5 py-3 border-b border-tdds-200 flex items-center justify-between">
          <div>
            <div className="eyebrow">P&L Waterfall</div>
            <div className="font-display font-bold text-tdds-900 text-base mt-0.5">Lever-by-lever contribution to margin</div>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-tdds-500 font-medium">
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[1px] bg-tdds-300" />Baseline</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[1px] bg-magenta-500" />Counter-offer</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[1px] bg-tdds-900 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[2px] before:bg-success" />Negotiation impact</span>
          </div>
        </div>
        <div className="p-5">
          <Waterfall
            components={liveComponents}
            baselineCm={baselineCm}
            proposedCm={proposedCm}
            targetCm={deal.targetCmM}
            highlightLeverId={hoverLeverId}
            onRowHover={setHoverLeverId}
          />
        </div>
      </Card>

      {/* ── Levers — sliders drive the waterfall ── */}
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <div className="eyebrow">Levers we're pulling</div>
          <div className="font-display font-bold text-tdds-900 text-base mt-1">{deal.levers.length} active hypotheses · drag any slider</div>
        </div>
        <div className="text-[11px] text-tdds-500 font-medium">
          Hover a card to highlight its bar · drag the slider to recompute CM in real time
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {deal.levers.map(l => (
          <LeverCard
            key={l.id}
            lever={l}
            componentBaseline={deal.components.find(c => c.id === l.componentId)!.baseline}
            value={values[l.componentId] ?? deal.components.find(c => c.id === l.componentId)!.proposed}
            onChange={v => setLeverValue(l.componentId, v)}
            hovered={hoverLeverId === l.id}
            onHoverChange={hovered => setHoverLeverId(hovered ? l.id : null)}
          />
        ))}
      </div>

      <MonteCarloModal
        open={wargameOpen}
        onClose={() => setWargameOpen(false)}
        deal={deal}
        proposedValues={values}
        onApplyScenario={vals => {
          setValues(vals)
          setWargameOpen(false)
          toast.success('Best-case scenario applied', { description: 'Lever positions updated. Review the waterfall and send if ready.' })
        }}
      />
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Lever card with slider
// ────────────────────────────────────────────────────────────

interface LeverCardProps {
  lever: Lever
  componentBaseline: number
  value: number
  onChange: (v: number) => void
  hovered: boolean
  onHoverChange: (hovered: boolean) => void
}

function LeverCard({ lever, componentBaseline, value, onChange, hovered, onHoverChange }: LeverCardProps) {
  const delta = value - componentBaseline
  const improved = lever.improveBy === 'increase' ? value > componentBaseline : value < componentBaseline
  const changed = Math.abs(delta) > 0.01

  // Slider progress for the magenta fill
  const range = lever.max - lever.min
  const pct = range > 0 ? ((value - lever.min) / range) * 100 : 0

  return (
    <div
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      className={cn(
        'rounded-md bg-white p-5 transition-all duration-150 ease-tdds',
        'ring-1',
        hovered ? 'ring-magenta-500 shadow-md' : 'ring-tdds-200 hover:ring-tdds-300',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="font-display font-bold text-tdds-900 text-[14px] tracking-tight leading-tight">{lever.name}</div>
        <Badge
          tone={lever.confidence === 'high' ? 'success' : lever.confidence === 'medium' ? 'high' : 'monitor'}
          variant="dot"
          uppercase
        >
          {lever.confidence}
        </Badge>
      </div>

      {/* Hypothesis */}
      <p className="text-[12px] text-tdds-600 leading-relaxed mb-4">{lever.hypothesis}</p>

      {/* Slider with current / baseline values inline */}
      <div className="mb-3">
        <div className="flex items-baseline justify-between mb-2 text-[11px] font-medium tabular-nums">
          <span className="text-tdds-500">
            Baseline <span className="text-tdds-700">{formatMoney(componentBaseline * 1_000_000, { sign: componentBaseline > 0, decimals: 1 })}</span>
          </span>
          <span className={cn(
            'font-display font-bold text-[18px] leading-none tracking-tight',
            !changed ? 'text-tdds-700' : improved ? 'text-magenta-600' : 'text-critical',
          )}>
            {formatMoney(value * 1_000_000, { sign: value > 0, decimals: 1 })}
          </span>
        </div>

        <input
          type="range"
          min={lever.min}
          max={lever.max}
          step={lever.step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="custom-slider w-full"
          style={{ '--pct': `${pct}%` } as React.CSSProperties}
          aria-label={`${lever.name} value`}
        />

        <div className="flex justify-between text-[10px] text-tdds-400 mt-1 tabular-nums font-medium">
          <span>{formatMoney(lever.min * 1_000_000, { sign: lever.min > 0, decimals: 1 })}</span>
          <span>{formatMoney(lever.max * 1_000_000, { sign: lever.max > 0, decimals: 1 })}</span>
        </div>
      </div>

      {/* Source + delta */}
      <div className="pt-3 border-t border-tdds-100 flex items-baseline justify-between gap-2">
        <div className="text-[10px] text-tdds-400 font-semibold uppercase tracking-wider leading-tight">{lever.source}</div>
        <div className={cn(
          'font-display font-extrabold tabular-nums text-[15px] leading-none tracking-tight shrink-0',
          !changed ? 'text-tdds-400' : improved ? 'text-success' : 'text-critical',
        )}>
          {!changed ? '—' : (delta > 0 ? '+' : '') + formatMoney(delta * 1_000_000, { decimals: 1 })}
        </div>
      </div>

      {lever.caveat && (
        <div className="mt-2.5 px-2 py-1.5 bg-warning/8 rounded-sm text-[11px] text-warning font-medium leading-snug">
          Pending: {lever.caveat}
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Sub-components for the hero CM strip
// ────────────────────────────────────────────────────────────

function CmFigure({ eyebrow, value, sub, accent }: { eyebrow: string; value: string; sub?: React.ReactNode; accent?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="eyebrow mb-2">{eyebrow}</div>
      <div className={cn(
        'font-display font-extrabold tabular-nums leading-none tracking-tight text-[56px] transition-colors',
        accent ? 'text-magenta-500' : 'text-tdds-900',
      )}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-tdds-500 mt-3 font-medium">{sub}</div>}
    </div>
  )
}

function CmArrow({ delta }: { delta: number }) {
  return (
    <div className="self-end pb-4 flex flex-col items-center gap-1">
      <div className={cn(
        'text-[13px] font-bold tabular-nums px-2 py-1 rounded-sm transition-colors',
        delta > 0 ? 'text-success bg-success/8' : delta < 0 ? 'text-critical bg-critical/8' : 'text-tdds-500 bg-tdds-100',
      )}>
        {delta > 0 ? '+' : ''}{formatMoney(delta * 1_000_000, { decimals: 1 })}
      </div>
      <svg width="56" height="14" viewBox="0 0 56 14" fill="none" className="text-tdds-300">
        <path d="M0 7 L50 7 M46 2 L52 7 L46 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function computeCm(components: Negotiation['components'], values: Record<string, number>): number {
  return components.reduce((sum, c) => sum + (values[c.id] ?? c.proposed), 0)
}
