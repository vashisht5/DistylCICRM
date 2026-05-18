/**
 * Monte Carlo war game modal.
 *
 * Runs N (default 1000) simulations of the negotiation. For each run,
 * each lever is sampled from its [min, max] range using a triangular
 * distribution centered on the user's current proposed value — vendor
 * pushback ≠ exact lever value, so the distribution captures uncertainty.
 *
 * Outputs P10/P50/P90, best/worst CM, win probability vs Bain target,
 * and a histogram. Mike sees a *range*, not a point estimate.
 */

import { useMemo, useState, useEffect, useCallback } from 'react'
import { X, Play, RefreshCcw, Target, TrendingUp, TrendingDown } from 'lucide-react'
import { Button, Badge } from '@/components/ui'
import type { Negotiation } from '@/lib/demo/pixel10'
import { cn, formatMoney } from '@/lib/utils'

interface MonteCarloModalProps {
  open: boolean
  onClose: () => void
  deal: Negotiation
  /** Current per-component proposed values from the Deal Room. */
  proposedValues: Record<string, number>
  /** Apply a specific scenario's lever values back to the workspace. */
  onApplyScenario?: (values: Record<string, number>) => void
}

const DEFAULT_RUNS = 1000

export function MonteCarloModal({ open, onClose, deal, proposedValues, onApplyScenario }: MonteCarloModalProps) {
  const [runs, setRuns] = useState(DEFAULT_RUNS)
  const [seed, setSeed] = useState(0) // bump to re-run
  const [running, setRunning] = useState(false)

  const result = useMemo(() => {
    if (!open) return null
    return simulate(deal, proposedValues, runs, seed)
  }, [open, deal, proposedValues, runs, seed])

  // Tiny "running" animation when seed changes
  useEffect(() => {
    if (!open) return
    setRunning(true)
    const t = setTimeout(() => setRunning(false), 400)
    return () => clearTimeout(t)
  }, [seed, runs, open])

  const handleRerun = useCallback(() => setSeed(s => s + 1), [])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-tdds-900/55 backdrop-blur-sm animate-fade-in p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-md ring-1 ring-tdds-200 shadow-lg w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <header className="px-6 py-4 border-b border-tdds-200 flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow mb-1">War game · Monte Carlo</div>
            <h2 className="font-display text-xl font-bold text-tdds-900 tracking-tight leading-tight">
              {deal.device} — {result ? result.runs.toLocaleString() : '—'} scenario simulation
            </h2>
            <p className="text-[12px] text-tdds-500 mt-1 max-w-xl leading-relaxed">
              Each lever is sampled from its uncertainty range with weight toward your current counter-offer. Shows the
              <span className="text-tdds-900 font-semibold"> distribution of likely outcomes</span> if Google pushes back.
            </p>
          </div>
          <button onClick={onClose} className="text-tdds-400 hover:text-tdds-900 p-1 -m-1" aria-label="Close">
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {result && (
            <>
              {/* Summary tiles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Tile
                  eyebrow="P10 — pessimistic"
                  value={formatMoney(result.p10 * 1_000_000, { decimals: 1 })}
                  sub="10% of runs land here or lower"
                />
                <Tile
                  eyebrow="P50 — median"
                  value={formatMoney(result.p50 * 1_000_000, { decimals: 1 })}
                  sub="The most likely outcome"
                  accent
                />
                <Tile
                  eyebrow="P90 — optimistic"
                  value={formatMoney(result.p90 * 1_000_000, { decimals: 1 })}
                  sub="10% of runs land here or higher"
                />
                <Tile
                  eyebrow={`vs. $${deal.targetCmM.toFixed(1)}M internal target`}
                  value={`${Math.round(result.winRate * 100)}%`}
                  sub="of scenarios meet or exceed"
                  tone={result.winRate > 0.5 ? 'success' : 'critical'}
                />
              </div>

              {/* Histogram */}
              <div className="bg-tdds-50 rounded-md ring-1 ring-tdds-200 p-5">
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <div className="eyebrow">Outcome distribution</div>
                    <div className="font-display font-bold text-tdds-900 text-[14px] mt-0.5 tracking-tight">
                      Contribution margin across {result.runs.toLocaleString()} scenarios
                    </div>
                  </div>
                  <div className="text-[11px] text-tdds-500 font-medium">
                    <span className="inline-flex items-center gap-1 mr-3">
                      <span className="w-2.5 h-2.5 rounded-[1px] bg-tdds-300" /> Run count
                    </span>
                    <span className="inline-flex items-center gap-1 mr-3">
                      <span className="w-2.5 h-2.5 rounded-[1px] bg-magenta-500" /> Current counter
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-[1px] bg-success" /> Internal target
                    </span>
                  </div>
                </div>

                <Histogram
                  bins={result.bins}
                  binEdges={result.binEdges}
                  currentCm={result.currentCm}
                  targetCm={deal.targetCmM}
                  p10={result.p10}
                  p50={result.p50}
                  p90={result.p90}
                  running={running}
                />
              </div>

              {/* Best / worst scenarios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ScenarioCard
                  kind="best"
                  cm={result.bestCm}
                  values={result.bestValues}
                  deal={deal}
                  onApply={onApplyScenario}
                />
                <ScenarioCard
                  kind="worst"
                  cm={result.worstCm}
                  values={result.worstValues}
                  deal={deal}
                  onApply={onApplyScenario}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="px-6 py-3 border-t border-tdds-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-[12px] text-tdds-500 font-medium">
            <span>Runs:</span>
            {[200, 500, 1000, 5000].map(n => (
              <button
                key={n}
                onClick={() => setRuns(n)}
                className={cn(
                  'px-2 py-0.5 rounded-sm tabular-nums font-semibold transition-colors',
                  runs === n ? 'bg-tdds-900 text-white' : 'text-tdds-600 hover:text-tdds-900 hover:bg-tdds-100',
                )}
              >
                {n.toLocaleString()}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="md" icon={RefreshCcw} onClick={handleRerun}>Re-run</Button>
            <Button variant="primary" size="md" icon={Play} onClick={handleRerun}>Run again</Button>
          </div>
        </footer>
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────
// Histogram
// ───────────────────────────────────────────────────────────

function Histogram({
  bins, binEdges, currentCm, targetCm, p10, p50, p90, running,
}: {
  bins: number[]
  binEdges: number[]
  currentCm: number
  targetCm: number
  p10: number
  p50: number
  p90: number
  running: boolean
}) {
  const maxCount = Math.max(...bins, 1)
  const minEdge = binEdges[0]
  const maxEdge = binEdges[binEdges.length - 1]
  const range = maxEdge - minEdge || 1
  const pct = (v: number) => ((v - minEdge) / range) * 100

  return (
    <div>
      {/* Bars */}
      <div className="relative h-32 flex items-end gap-px">
        {bins.map((count, i) => {
          const center = (binEdges[i] + binEdges[i + 1]) / 2
          const isP10toP90 = center >= p10 && center <= p90
          return (
            <div
              key={i}
              className={cn(
                'flex-1 rounded-t-[2px] transition-all duration-300',
                running ? 'opacity-50' : 'opacity-100',
                isP10toP90 ? 'bg-tdds-400' : 'bg-tdds-300',
              )}
              style={{ height: `${(count / maxCount) * 100}%` }}
              title={`${formatMoney(binEdges[i] * 1_000_000, { decimals: 1 })}–${formatMoney(binEdges[i + 1] * 1_000_000, { decimals: 1 })}: ${count} runs`}
            />
          )
        })}

        {/* Overlay markers */}
        <Marker pct={pct(currentCm)} color="magenta" label={`Counter ${formatMoney(currentCm * 1_000_000, { decimals: 1 })}`} top />
        <Marker pct={pct(targetCm)} color="success" label={`Target ${formatMoney(targetCm * 1_000_000, { decimals: 1 })}`} />
      </div>

      {/* P10/P50/P90 row */}
      <div className="relative h-6 mt-2 border-t border-tdds-200">
        <PercentileTick pct={pct(p10)} label="P10" value={p10} />
        <PercentileTick pct={pct(p50)} label="P50" value={p50} bold />
        <PercentileTick pct={pct(p90)} label="P90" value={p90} />
      </div>

      {/* X axis */}
      <div className="flex justify-between text-[10px] text-tdds-400 mt-1 tabular-nums font-medium">
        <span>{formatMoney(minEdge * 1_000_000, { decimals: 1 })}</span>
        <span>{formatMoney(maxEdge * 1_000_000, { decimals: 1 })}</span>
      </div>
    </div>
  )
}

function Marker({ pct, color, label, top }: { pct: number; color: 'magenta' | 'success'; label: string; top?: boolean }) {
  const lineColor = color === 'magenta' ? 'bg-magenta-500' : 'bg-success'
  const textColor = color === 'magenta' ? 'text-magenta-600' : 'text-success'
  return (
    <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: `calc(${pct}% - 1px)` }}>
      <div className={cn('absolute inset-y-0 w-[2px]', lineColor)} />
      <div className={cn(
        'absolute whitespace-nowrap text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-sm bg-white ring-1',
        textColor,
        color === 'magenta' ? 'ring-magenta-200' : 'ring-success/30',
        top ? '-top-1 -translate-y-full' : '-bottom-1 translate-y-full',
        'left-1/2 -translate-x-1/2',
      )}>
        {label}
      </div>
    </div>
  )
}

function PercentileTick({ pct, label, value, bold }: { pct: number; label: string; value: number; bold?: boolean }) {
  return (
    <div className="absolute top-0 flex flex-col items-center" style={{ left: `calc(${pct}% - 22px)` }}>
      <div className="w-px h-2 bg-tdds-300" />
      <div className={cn('text-[10px] tabular-nums whitespace-nowrap mt-0.5', bold ? 'text-tdds-900 font-semibold' : 'text-tdds-500 font-medium')}>
        {label} {formatMoney(value * 1_000_000, { decimals: 1 })}
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────
// Summary tiles + scenario cards
// ───────────────────────────────────────────────────────────

function Tile({ eyebrow, value, sub, accent, tone }: { eyebrow: string; value: string; sub?: string; accent?: boolean; tone?: 'success' | 'critical' }) {
  return (
    <div className="bg-white rounded-md ring-1 ring-tdds-200 p-4">
      <div className="eyebrow mb-2">{eyebrow}</div>
      <div className={cn(
        'font-display font-extrabold tabular-nums leading-none tracking-tight text-[26px]',
        accent ? 'text-magenta-500' : tone === 'success' ? 'text-success' : tone === 'critical' ? 'text-critical' : 'text-tdds-900',
      )}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-tdds-500 mt-2 font-medium leading-snug">{sub}</div>}
    </div>
  )
}

function ScenarioCard({ kind, cm, values, deal, onApply }: { kind: 'best' | 'worst'; cm: number; values: Record<string, number>; deal: Negotiation; onApply?: (v: Record<string, number>) => void }) {
  const isBest = kind === 'best'
  const Icon = isBest ? TrendingUp : TrendingDown
  return (
    <div className="bg-white rounded-md ring-1 ring-tdds-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="eyebrow flex items-center gap-1.5">
            <Icon className="w-3 h-3" strokeWidth={2.25} />
            {isBest ? 'Best case' : 'Worst case'}
          </div>
          <div className={cn(
            'font-display font-extrabold tabular-nums leading-none tracking-tight text-[32px] mt-2',
            isBest ? 'text-success' : 'text-critical',
          )}>
            {formatMoney(cm * 1_000_000, { decimals: 1 })}
          </div>
        </div>
        {onApply && isBest && (
          <Button variant="secondary" size="sm" onClick={() => onApply(values)} icon={Target}>Apply</Button>
        )}
      </div>
      <div className="space-y-1.5 mt-3 pt-3 border-t border-tdds-100">
        {deal.components.filter(c => c.leverId).map(c => {
          const v = values[c.id]
          const delta = v - c.baseline
          const improved = c.baseline < 0 ? v > c.baseline : v > c.baseline
          return (
            <div key={c.id} className="flex items-center justify-between text-[12px] tabular-nums">
              <span className="text-tdds-600 font-medium">{c.label}</span>
              <span className={cn(
                'font-semibold',
                improved ? 'text-success' : delta < 0 ? 'text-critical' : 'text-tdds-500',
              )}>
                {delta > 0 ? '+' : ''}{formatMoney(delta * 1_000_000, { decimals: 1 })}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ───────────────────────────────────────────────────────────
// Simulation core
// ───────────────────────────────────────────────────────────

type SimResult = {
  runs: number
  currentCm: number
  p10: number
  p50: number
  p90: number
  winRate: number
  bestCm: number
  bestValues: Record<string, number>
  worstCm: number
  worstValues: Record<string, number>
  bins: number[]
  binEdges: number[]
}

function simulate(deal: Negotiation, proposed: Record<string, number>, runs: number, _seed: number): SimResult {
  const cms: number[] = []
  let best = -Infinity
  let bestVals: Record<string, number> = {}
  let worst = Infinity
  let worstVals: Record<string, number> = {}

  // Lookup: for each lever, what range to sample from
  const leversByComponent = new Map<string, typeof deal.levers[number]>()
  for (const l of deal.levers) leversByComponent.set(l.componentId, l)

  for (let i = 0; i < runs; i++) {
    const sample: Record<string, number> = {}
    let cm = 0
    for (const c of deal.components) {
      const lever = leversByComponent.get(c.id)
      let v: number
      if (lever) {
        // Triangular distribution: mode = current proposed, edges = lever bounds
        const mode = proposed[c.id] ?? c.proposed
        v = triangular(lever.min, lever.max, mode)
      } else {
        v = c.proposed
      }
      sample[c.id] = v
      cm += v
    }
    cms.push(cm)
    if (cm > best) { best = cm; bestVals = sample }
    if (cm < worst) { worst = cm; worstVals = sample }
  }

  cms.sort((a, b) => a - b)
  const currentCm = deal.components.reduce((s, c) => s + (proposed[c.id] ?? c.proposed), 0)
  const p = (q: number) => cms[Math.min(cms.length - 1, Math.floor(q * cms.length))]
  const winRate = cms.filter(v => v >= deal.targetCmM).length / cms.length

  // Build histogram bins
  const min = cms[0]
  const max = cms[cms.length - 1]
  const binCount = 40
  const binSize = (max - min) / binCount || 1
  const edges = Array.from({ length: binCount + 1 }, (_, i) => min + i * binSize)
  const bins = new Array(binCount).fill(0)
  for (const cm of cms) {
    let idx = Math.floor((cm - min) / binSize)
    if (idx >= binCount) idx = binCount - 1
    if (idx < 0) idx = 0
    bins[idx]++
  }

  return {
    runs,
    currentCm,
    p10: p(0.1),
    p50: p(0.5),
    p90: p(0.9),
    winRate,
    bestCm: best,
    bestValues: bestVals,
    worstCm: worst,
    worstValues: worstVals,
    bins,
    binEdges: edges,
  }
}

function triangular(min: number, max: number, mode: number): number {
  const u = Math.random()
  const c = (mode - min) / (max - min)
  if (u < c) return min + Math.sqrt(u * (max - min) * (mode - min))
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode))
}
