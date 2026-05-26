/**
 * Deal Room — per-vendor negotiation workspace.
 *
 * Levers mutate a working draft (`values` keyed by component id). The
 * waterfall, CM headline, and impact rail all derive from that state.
 *
 * Recommended lever positions update as new signals land; the slider
 * triangle marks the current recommendation and the History popover
 * exposes prior revisions.
 */

import { useParams, useNavigate, Link } from 'react-router-dom'
import { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, Calendar, Clock, Send, Sparkles, RotateCcw, Layers, History, Check } from 'lucide-react'
import { PageHeader, Card, Button, Badge, EmptyState } from '@/components/ui'
import { Waterfall } from '@/components/waterfall/Waterfall'
import { MonteCarloModal } from '@/components/wargame/MonteCarloModal'
import { PIXEL_10, STATUS_LABEL, AGENT_SNAPSHOTS, type Negotiation, type Lever, type AgentSnapshot } from '@/lib/demo/pixel10'
import { cn, formatMoney, formatRelative } from '@/lib/utils'

export default function DealRoom() {
  const { dealId } = useParams()

  const deal: Negotiation | null = dealId === 'pixel-10-q1-2026' ? PIXEL_10 : null

  if (!deal) {
    return (
      <div className="px-10 py-8 max-w-[1400px] mx-auto">
        <Link to="/negotiations" className="text-[12px] text-tdds-500 hover:text-tdds-900 inline-flex items-center gap-1 mb-6 font-medium">
          <ArrowLeft className="w-3 h-3" strokeWidth={2} /> All negotiations
        </Link>
        <EmptyState
          variant="editorial"
          title="Tender workspace pending"
          description="The detailed deal room for this tender hasn’t been set up yet. The portfolio view remains available."
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
  const [scrubberSnapshotId, setScrubberSnapshotId] = useState<string>(AGENT_SNAPSHOTS[AGENT_SNAPSHOTS.length - 1].id)

  const selectedSnapshot = useMemo(
    () => AGENT_SNAPSHOTS.find(s => s.id === scrubberSnapshotId) ?? AGENT_SNAPSHOTS[AGENT_SNAPSHOTS.length - 1],
    [scrubberSnapshotId],
  )
  const isViewingNow = selectedSnapshot.id === AGENT_SNAPSHOTS[AGENT_SNAPSHOTS.length - 1].id

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
    toast.info('Reset to working draft', { description: 'Lever positions restored to last counter-offer.' })
  }, [initialValues])

  const applyRevision = useCallback((snap: AgentSnapshot) => {
    const next: Record<string, number> = {}
    for (const c of deal.components) {
      next[c.id] = snap.positions[c.id] ?? c.proposed
    }
    setValues(next)
  }, [deal])

  const acceptAgentRec = useCallback(() => {
    applyRevision(selectedSnapshot)
    toast.success('Recommendation applied', { description: 'Lever positions updated.' })
  }, [applyRevision, selectedSnapshot])

  const onSelectSnapshot = useCallback((id: string) => {
    const snap = AGENT_SNAPSHOTS.find(s => s.id === id)
    if (!snap) return
    setScrubberSnapshotId(id)
    applyRevision(snap)
  }, [applyRevision])

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

  // CM if the user accepts the selected agent snapshot's full position
  const agentCm = useMemo(() => {
    const positions = selectedSnapshot.positions
    return deal.components.reduce((sum, c) => sum + (positions[c.id] ?? c.proposed), 0)
  }, [deal, selectedSnapshot])

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

      {/* ── Recommendation status + revision history ─────────── */}
      <RecommendationBar
        snapshots={AGENT_SNAPSHOTS}
        selectedId={scrubberSnapshotId}
        onSelect={onSelectSnapshot}
        isViewingNow={isViewingNow}
        agentCm={agentCm}
        onApply={acceptAgentRec}
      />

      {/* ── Hero CM strip — live recalc ── */}
      <div className="bg-white rounded-md ring-1 ring-tdds-200 p-8 mb-8">
        <div className="eyebrow mb-4">Contribution Margin — Q1 2026 Pixel 10 cycle</div>
        <div className="flex items-end gap-8 lg:gap-12 flex-wrap">
          <CmFigure
            eyebrow="Vendor proposal · as-is"
            value={formatMoney(baselineCm * 1_000_000, { decimals: 1 })}
            sub={<button onClick={resetToVendor} className="text-tdds-500 hover:text-tdds-900 underline-offset-2 hover:underline">Reset to baseline</button>}
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
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[1px] bg-tdds-400" />Vendor proposal</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[1px] bg-magenta-500" />With counter-offer</span>
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

      {/* ── Levers ─────────────────────────────── */}
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <div className="eyebrow">Levers</div>
          <div className="font-display font-bold text-tdds-900 text-base mt-1">{deal.levers.length} active</div>
        </div>
        <div className="text-[11px] text-tdds-500 font-medium inline-flex items-center gap-1.5">
          <AgentTriangle className="w-2.5 h-2.5" />
          <span>Recommendation</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {deal.levers.map(l => {
          const agentRec = selectedSnapshot.positions[l.componentId] ?? l.agentRecommendation
          return (
            <LeverCard
              key={l.id}
              lever={l}
              componentBaseline={deal.components.find(c => c.id === l.componentId)!.baseline}
              value={values[l.componentId] ?? deal.components.find(c => c.id === l.componentId)!.proposed}
              agentRec={agentRec}
              onChange={v => setLeverValue(l.componentId, v)}
              onResetToAgent={() => setLeverValue(l.componentId, agentRec)}
              hovered={hoverLeverId === l.id}
              onHoverChange={hovered => setHoverLeverId(hovered ? l.id : null)}
            />
          )
        })}
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
// Recommendation bar — compact status row + revision-history popover.
// Designed to read like an audit log, not a tutorial timeline.
// ────────────────────────────────────────────────────────────

interface RecommendationBarProps {
  snapshots: AgentSnapshot[]
  selectedId: string
  onSelect: (id: string) => void
  isViewingNow: boolean
  agentCm: number
  onApply: () => void
}

const NOW_DATE = new Date('2026-05-26T08:00:00Z')

function formatAge(iso: string): string {
  const ms = NOW_DATE.getTime() - new Date(iso).getTime()
  const days = Math.floor(ms / 86_400_000)
  if (days < 1) {
    const hrs = Math.max(1, Math.floor(ms / 3_600_000))
    return `${hrs}h ago`
  }
  if (days < 14) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function RecommendationBar({ snapshots, selectedId, onSelect, isViewingNow, agentCm, onApply }: RecommendationBarProps) {
  const [historyOpen, setHistoryOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = snapshots.find(s => s.id === selectedId) ?? snapshots[snapshots.length - 1]
  const latest = snapshots[snapshots.length - 1]
  const ordered = [...snapshots].reverse() // newest first in popover

  useEffect(() => {
    if (!historyOpen) return
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setHistoryOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setHistoryOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [historyOpen])

  return (
    <div className="mb-6">
      <div className="bg-white ring-1 ring-tdds-200 rounded-md px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
        {/* Status — left side */}
        <div className="flex items-baseline gap-3 min-w-0">
          <div className="flex items-baseline gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-success self-center" aria-hidden />
            <span className="eyebrow">Recommendation</span>
          </div>
          <span className="text-tdds-300 self-center">·</span>
          <div className="min-w-0 flex items-baseline gap-2 flex-wrap">
            <span className="font-display font-bold text-tdds-900 text-[15px] tabular-nums tracking-tight">
              {formatMoney(agentCm * 1_000_000, { decimals: 1 })} CM
            </span>
            <span className="text-[12px] text-tdds-500 truncate">
              · updated {formatAge(latest.at)} · {latest.trigger}
            </span>
          </div>
        </div>

        {/* Actions — right side */}
        <div ref={ref} className="relative flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setHistoryOpen(o => !o)}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-semibold rounded-sm transition-colors',
              'text-tdds-700 hover:text-tdds-900 hover:bg-tdds-50',
              historyOpen && 'bg-tdds-50 text-tdds-900',
            )}
          >
            <History className="w-3.5 h-3.5" strokeWidth={2} />
            History
            <span className="text-tdds-400 font-medium tabular-nums">({snapshots.length})</span>
          </button>
          <Button variant="secondary" size="sm" onClick={onApply}>
            Apply to all levers
          </Button>

          {historyOpen && (
            <div className="absolute right-0 top-full mt-1 z-30 w-[420px] bg-white ring-1 ring-tdds-200 rounded-md shadow-lg overflow-hidden">
              <div className="px-4 py-2.5 border-b border-tdds-100 bg-tdds-50 flex items-baseline justify-between">
                <div className="eyebrow">Revision history</div>
                <div className="text-[10px] text-tdds-500 font-medium tabular-nums">{snapshots.length} updates · RFP launched May 1</div>
              </div>
              <ul className="py-1 max-h-96 overflow-y-auto">
                {ordered.map((s, i) => {
                  const active = s.id === selectedId
                  const isLatest = i === 0
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => { onSelect(s.id); setHistoryOpen(false) }}
                        className={cn(
                          'w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors',
                          active ? 'bg-magenta-50/50' : 'hover:bg-tdds-50',
                        )}
                      >
                        <div className="w-4 mt-0.5 flex justify-center shrink-0">
                          {active ? (
                            <Check className="w-3.5 h-3.5 text-magenta-500" strokeWidth={2.5} />
                          ) : (
                            <span className={cn(
                              'w-2 h-2 rounded-full',
                              isLatest ? 'bg-success' : 'bg-tdds-300',
                            )} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-3">
                            <div className={cn(
                              'font-semibold text-[12px] tracking-tight',
                              active ? 'text-magenta-700' : 'text-tdds-900',
                            )}>
                              {isLatest ? 'Current' : new Date(s.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              {isLatest && <span className="ml-1.5 text-[10px] font-medium text-tdds-500 uppercase tracking-wider">· {formatAge(s.at)}</span>}
                            </div>
                            <div className="text-[10px] text-tdds-400 font-medium uppercase tracking-wider">
                              {isLatest ? '' : formatAge(s.at)}
                            </div>
                          </div>
                          <div className="text-[11px] text-tdds-600 mt-0.5 leading-snug">{s.trigger}</div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Sub-row only when scrubbed to history */}
      {!isViewingNow && (
        <div className="mt-2 px-3 py-2 bg-tdds-50 ring-1 ring-tdds-200 rounded-sm flex items-center justify-between text-[12px]">
          <div className="text-tdds-600">
            <span className="font-semibold text-tdds-900">Viewing revision from {new Date(selected.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.</span>
            <span className="ml-1.5 text-tdds-500">Lever markers reflect this revision.</span>
          </div>
          <button
            type="button"
            onClick={() => onSelect(latest.id)}
            className="text-tdds-700 hover:text-tdds-900 font-semibold underline-offset-2 hover:underline"
          >
            Return to current
          </button>
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// Lever card with slider + agent rec marker
// ────────────────────────────────────────────────────────────

interface LeverCardProps {
  lever: Lever
  componentBaseline: number
  value: number
  agentRec: number
  onChange: (v: number) => void
  onResetToAgent: () => void
  hovered: boolean
  onHoverChange: (hovered: boolean) => void
}

function LeverCard({ lever, componentBaseline, value, agentRec, onChange, onResetToAgent, hovered, onHoverChange }: LeverCardProps) {
  const delta = value - componentBaseline
  const improved = lever.improveBy === 'increase' ? value > componentBaseline : value < componentBaseline
  const changed = Math.abs(delta) > 0.01

  // Slider progress for the magenta fill
  const range = lever.max - lever.min
  const pct = range > 0 ? ((value - lever.min) / range) * 100 : 0
  const agentPct = range > 0 ? Math.max(0, Math.min(100, ((agentRec - lever.min) / range) * 100)) : 0

  // Delta vs agent — positive means user is more aggressive than agent on the value-improving direction
  const valueVsAgent = value - agentRec
  const aheadOfAgent = lever.improveBy === 'increase' ? valueVsAgent > 0.01 : valueVsAgent < -0.01
  const behindAgent  = lever.improveBy === 'increase' ? valueVsAgent < -0.01 : valueVsAgent > 0.01
  const matchesAgent = !aheadOfAgent && !behindAgent

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

        <div className="relative">
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
          {/* Recommendation marker — purely visual; the Apply link below performs the action */}
          <span
            className="absolute -bottom-2 -translate-x-1/2 pointer-events-none"
            style={{ left: `calc(8px + (100% - 16px) * ${agentPct / 100})` }}
            aria-hidden
          >
            <AgentTriangle className="w-3 h-3" />
          </span>
        </div>

        <div className="flex justify-between text-[10px] text-tdds-400 mt-3 tabular-nums font-medium">
          <span>{formatMoney(lever.min * 1_000_000, { sign: lever.min > 0, decimals: 1 })}</span>
          <span>{formatMoney(lever.max * 1_000_000, { sign: lever.max > 0, decimals: 1 })}</span>
        </div>
      </div>

      {/* Recommendation row — quiet, no box */}
      <div className="mb-3 flex items-baseline justify-between gap-2 text-[11px]">
        <div className="text-tdds-500 leading-tight">
          Recommended <span className="text-tdds-800 font-semibold tabular-nums">{formatMoney(agentRec * 1_000_000, { sign: agentRec > 0, decimals: 1 })}</span>
          {matchesAgent ? (
            <span className="ml-1.5 text-success font-medium">· matches your position</span>
          ) : (
            <span className="ml-1.5 text-tdds-500">
              · you’re {aheadOfAgent ? 'ahead' : 'behind'} by{' '}
              <span className="tabular-nums font-semibold text-tdds-700">{formatMoney(Math.abs(valueVsAgent) * 1_000_000, { decimals: 1 })}</span>
            </span>
          )}
        </div>
        {!matchesAgent && (
          <button
            type="button"
            onClick={onResetToAgent}
            className="text-tdds-700 hover:text-tdds-900 font-semibold underline-offset-2 hover:underline shrink-0"
          >
            Apply
          </button>
        )}
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

// ─── Agent rec triangle marker ──────────────────────────────────

function AgentTriangle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={cn('text-magenta-500', className)} aria-hidden="true">
      <path d="M6 1 L11 11 L1 11 Z" fill="currentColor" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
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
