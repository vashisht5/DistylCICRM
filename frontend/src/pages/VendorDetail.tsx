/**
 * Vendor detail — historicals, last-cycle outcome, and EIP roll-off.
 */

import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, TrendingUp, TrendingDown, Smartphone, Layers, Sparkles, ChevronDown, MessageSquare } from 'lucide-react'
import { PageHeader, Card, Badge, Button } from '@/components/ui'
import { VENDORS } from '@/lib/demo/supportingData'
import { NEGOTIATIONS_INDEX } from '@/lib/demo/pixel10'
import {
  GOOGLE_HISTORY,
  GOOGLE_EIP_ROLLOFF,
  PIXEL_9_NEGOTIATION_OUTCOME,
  GOOGLE_DEMAND_SYNTHESIS,
} from '@/lib/demo/googleHistory'
import { CustomQueryModal, QUICK_CUTS, type QuickCutId } from '@/components/vendor/CustomQueryModal'
import { cn, formatMoney } from '@/lib/utils'

export default function VendorDetail() {
  const { vendorId } = useParams()
  const navigate = useNavigate()
  const vendor = VENDORS.find(v => v.id === vendorId)
  const [queryOpen, setQueryOpen] = useState(false)
  const [activeCutId, setActiveCutId] = useState<QuickCutId | null>(null)

  const openWithCut = (id: QuickCutId | null) => {
    setActiveCutId(id)
    setQueryOpen(true)
  }

  if (!vendor || vendor.id !== 'google') {
    return (
      <div className="px-10 py-8 max-w-[1400px] mx-auto">
        <Link to="/vendors" className="text-[12px] text-tdds-500 hover:text-tdds-900 inline-flex items-center gap-1 mb-6">
          <ArrowLeft className="w-3 h-3" /> Vendors
        </Link>
        <div className="bg-white ring-1 ring-tdds-200 rounded-md p-8 text-center">
          <div className="font-display text-lg font-bold text-tdds-900 tracking-tight">{vendor?.name ?? 'Vendor'} historicals not yet available</div>
          <p className="text-[13px] text-tdds-500 mt-2">Cycle history will populate once vendor data is connected.</p>
        </div>
      </div>
    )
  }

  const neg = NEGOTIATIONS_INDEX.find(n => n.vendor.name === 'Google')
  const latest = GOOGLE_HISTORY[GOOGLE_HISTORY.length - 1]
  const eipTotal = GOOGLE_EIP_ROLLOFF.reduce((s, e) => s + e.unitsK, 0)

  return (
    <div className="px-10 py-8 max-w-[1400px] mx-auto">
      <Link to="/vendors" className="text-[12px] text-tdds-500 hover:text-tdds-900 inline-flex items-center gap-1 mb-6 font-medium">
        <ArrowLeft className="w-3 h-3" strokeWidth={2} /> All vendors
      </Link>

      <PageHeader
        eyebrow={`Vendor · ${vendor.hq}`}
        title="Google"
        meta={
          <>
            <span><strong className="text-tdds-900 font-semibold">${vendor.annualSpendBnUsd.toFixed(2)}B</strong> annual spend</span>
            <span className="text-tdds-300">·</span>
            <Badge tone="brand" variant="dot" uppercase>Pixel 10 in flight</Badge>
          </>
        }
        actions={
          neg ? (
            <Button variant="primary" size="md" iconRight={ArrowRight} onClick={() => navigate(`/negotiations/${neg.id}`)}>
              Pixel 10 deal room
            </Button>
          ) : null
        }
      />

      {/* ── Demand synthesis tiles ──────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <SynthTile
          eyebrow="Known demand · EIP roll-off"
          value={`${GOOGLE_DEMAND_SYNTHESIS.knownDemandUnitsK}K`}
          sub="Pixel devices coming off EIP this quarter"
          accent
        />
        <SynthTile
          eyebrow="Likely upgrade capture"
          value={`${GOOGLE_DEMAND_SYNTHESIS.upgradeCaptureK}K`}
          sub={`Weighted by intent — ${Math.round(GOOGLE_DEMAND_SYNTHESIS.upgradeCaptureK / GOOGLE_DEMAND_SYNTHESIS.knownDemandUnitsK * 100)}% of roll-off`}
        />
        <SynthTile
          eyebrow="Unit volume · 3-cycle CAGR"
          value={`+${GOOGLE_DEMAND_SYNTHESIS.trendUnitsCagrPct.toFixed(1)}%`}
          sub="Pixel 7 → 8 → 9 growth"
          trend="up"
        />
        <SynthTile
          eyebrow="Sell-through delta · last cycle"
          value={`${GOOGLE_DEMAND_SYNTHESIS.promoEfficiencyDeltaPct}pp`}
          sub="Pixel 9 softened 6pp vs. Pixel 8"
          trend="down"
        />
      </div>

      {/* ── Ask the data — custom query + quick cuts ──────────── */}
      <div className="mb-6 bg-white rounded-md ring-1 ring-tdds-200 px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-sm bg-magenta-50 ring-1 ring-magenta-200 grid place-items-center shrink-0">
            <Sparkles className="w-4 h-4 text-magenta-500" strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <div className="eyebrow">Ask the data</div>
            <div className="font-display font-bold text-tdds-900 text-base tracking-tight leading-tight mt-0.5">
              Slice 11 quarters of Google procurement history
            </div>
            <div className="text-[11px] text-tdds-500 mt-0.5 font-medium">
              Cycle-level data on pricing, sell-through, promos, returns, MDF.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <QuickCutsDropdown onPick={openWithCut} />
          <button
            type="button"
            onClick={() => openWithCut(null)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-magenta-500 hover:bg-magenta-600 text-white text-[12px] font-semibold rounded-sm transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" strokeWidth={2.25} />
            Ask a custom question
          </button>
        </div>
      </div>

      {/* ── Historical sales: volume + sell-through ─────────────── */}
      <Card className="mb-8">
        <div className="px-5 py-3 border-b border-tdds-200 flex items-baseline justify-between">
          <div>
            <div className="eyebrow">Historical sales</div>
            <div className="font-display font-bold text-tdds-900 text-base mt-0.5">Volume and sell-through · last 3 cycles</div>
          </div>
          <div className="text-[11px] text-tdds-500 font-medium">
            <span className="inline-flex items-center gap-1.5 mr-3"><span className="w-2.5 h-2.5 rounded-[1px] bg-tdds-900" />Units sold (K)</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[1px] bg-magenta-500" />Sell-through %</span>
          </div>
        </div>
        <div className="p-5">
          <VolumeChart history={GOOGLE_HISTORY} />
        </div>
      </Card>

      {/* ── Two-column: pricing & MDF + promo support ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <div className="px-5 py-3 border-b border-tdds-200">
            <div className="eyebrow">Pricing · wholesale vs list</div>
            <div className="font-display font-bold text-tdds-900 text-base mt-0.5">Per-unit ASP — three cycles</div>
          </div>
          <div className="p-5">
            <PricingTable history={GOOGLE_HISTORY} />
          </div>
        </Card>

        <Card>
          <div className="px-5 py-3 border-b border-tdds-200">
            <div className="eyebrow">MDF & promo co-fund</div>
            <div className="font-display font-bold text-tdds-900 text-base mt-0.5">Carrier-direct $ released by Google</div>
          </div>
          <div className="p-5">
            <MdfPromoTable history={GOOGLE_HISTORY} />
          </div>
        </Card>
      </div>

      {/* ── Last cycle outcome — what we landed on Pixel 9 ─────── */}
      <Card className="mb-8">
        <div className="px-5 py-3 border-b border-tdds-200 flex items-baseline justify-between">
          <div>
            <div className="eyebrow">Last cycle negotiation outcome</div>
            <div className="font-display font-bold text-tdds-900 text-base mt-0.5">
              {PIXEL_9_NEGOTIATION_OUTCOME.device} · {PIXEL_9_NEGOTIATION_OUTCOME.cycle} — ask vs. landing per lever
            </div>
          </div>
          <div className="tabular-nums text-right">
            <div className="text-[11px] text-tdds-500 font-medium">Opening → Signed</div>
            <div className="font-display text-[18px] font-bold tracking-tight">
              <span className="text-tdds-500">{formatMoney(PIXEL_9_NEGOTIATION_OUTCOME.openingProposalCmM * 1_000_000, { decimals: 1 })}</span>
              <span className="text-tdds-300 mx-1.5">→</span>
              <span className="text-magenta-600">{formatMoney(PIXEL_9_NEGOTIATION_OUTCOME.signedCmM * 1_000_000, { decimals: 1 })}</span>
              <span className="text-success text-[12px] ml-2">+{formatMoney(PIXEL_9_NEGOTIATION_OUTCOME.upliftM * 1_000_000, { decimals: 1 })}</span>
            </div>
          </div>
        </div>
        <div className="p-5">
          <LastCycleTable />
        </div>
      </Card>

      {/* ── EIP roll-off ─────────────────────────────────────────── */}
      <Card className="mb-8">
        <div className="px-5 py-3 border-b border-tdds-200">
          <div className="eyebrow">EIP roll-off · Q1 2026</div>
          <div className="font-display font-bold text-tdds-900 text-base mt-0.5">
            {eipTotal}K Pixel devices coming off contract this quarter
          </div>
        </div>
        <div className="p-5">
          <EipTable />
        </div>
      </Card>

      <CustomQueryModal
        open={queryOpen}
        onClose={() => setQueryOpen(false)}
        initialCutId={activeCutId}
        vendorName="Google"
      />

      {/* ── In-flight negotiation ─────────────────────────────────── */}
      {neg && (
        <Card interactive onClick={() => navigate(`/negotiations/${neg.id}`)} className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="eyebrow">In flight · Q1 2026</div>
              <div className="font-display font-bold text-tdds-900 text-base mt-0.5">
                Pixel 10 — counter draft at <span className="text-magenta-600">{formatMoney(neg.proposedCmM * 1_000_000, { decimals: 1 })}</span> CM
              </div>
              <div className="text-[12px] text-tdds-500 mt-1 tabular-nums">
                Target {formatMoney(neg.targetCmM * 1_000_000, { decimals: 1 })} · {neg.daysToClose} days to close
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="md" icon={Layers} onClick={(e) => { e.stopPropagation(); navigate('/battle-cards'); }}>Battle card</Button>
              <ArrowRight className="w-5 h-5 text-tdds-400" strokeWidth={1.85} />
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Quick cuts dropdown ────────────────────────────────────────

function QuickCutsDropdown({ onPick }: { onPick: (id: QuickCutId) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold rounded-sm transition-colors',
          'bg-white text-tdds-700 ring-1 ring-tdds-200 hover:ring-tdds-300 hover:text-tdds-900',
          open && 'ring-tdds-300 text-tdds-900',
        )}
      >
        Quick cuts
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} strokeWidth={2.25} />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-[340px] bg-white text-tdds-900 ring-1 ring-tdds-200 rounded-md shadow-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-tdds-100 eyebrow bg-tdds-50">Pre-built queries</div>
          <ul className="py-1 max-h-96 overflow-y-auto">
            {QUICK_CUTS.map(q => (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => { onPick(q.id); setOpen(false) }}
                  className="w-full text-left px-3 py-2 hover:bg-tdds-50 transition-colors group"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-semibold text-tdds-900 text-[12px] tracking-tight">{q.label}</div>
                    <ArrowRight className="w-3 h-3 text-tdds-300 group-hover:text-magenta-500 shrink-0" strokeWidth={2} />
                  </div>
                  <div className="text-[11px] text-tdds-500 mt-0.5 leading-snug">{q.hint}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Demand synthesis tile ──────────────────────────────────────

function SynthTile({
  eyebrow, value, sub, accent, trend,
}: {
  eyebrow: string; value: string; sub: string; accent?: boolean; trend?: 'up' | 'down'
}) {
  const Icon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null
  return (
    <div className={cn('bg-white rounded-md ring-1 p-4', accent ? 'ring-magenta-300' : 'ring-tdds-200')}>
      <div className="eyebrow mb-2">{eyebrow}</div>
      <div className="flex items-baseline gap-1.5">
        <div className={cn(
          'font-display font-extrabold tabular-nums leading-none tracking-tight text-[26px]',
          accent ? 'text-magenta-500' : 'text-tdds-900',
        )}>
          {value}
        </div>
        {Icon && <Icon className={cn('w-4 h-4 shrink-0', trend === 'up' ? 'text-success' : 'text-critical')} strokeWidth={2.25} />}
      </div>
      <div className="text-[11px] text-tdds-500 mt-2 font-medium leading-snug">{sub}</div>
    </div>
  )
}

// ─── Volume + sell-through chart ────────────────────────────────

function VolumeChart({ history }: { history: typeof GOOGLE_HISTORY }) {
  const maxUnits = Math.max(...history.map(h => h.unitsK))
  const CHART_H = 220
  const BAR_W = 96 // px — fixed-width columns so bars stay slim regardless of card width
  return (
    <div className="flex justify-around items-end gap-8 pt-2" style={{ height: CHART_H + 56 }}>
      {history.map(h => {
        const barH = (h.unitsK / maxUnits) * CHART_H
        return (
          <div key={h.cycle} className="flex flex-col items-center justify-end gap-2" style={{ width: BAR_W }}>
            <div className="text-[12px] font-bold tabular-nums text-tdds-900">{h.unitsK}K</div>
            <div
              className="relative rounded-t-sm bg-tdds-900 transition-all flex items-start justify-center"
              style={{ height: barH, width: BAR_W }}
            >
              <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold tabular-nums text-magenta-600 bg-white rounded-sm px-1.5 py-0.5 ring-1 ring-magenta-200 whitespace-nowrap shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-magenta-500" />
                {h.sellThroughPct}%
              </div>
            </div>
            <div className="text-center pt-1">
              <div className="text-[12px] font-semibold text-tdds-900 leading-tight">{h.device}</div>
              <div className="text-[10px] text-tdds-400 mt-0.5 font-medium uppercase tracking-wider">{h.cycle}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Pricing table ──────────────────────────────────────────────

function PricingTable({ history }: { history: typeof GOOGLE_HISTORY }) {
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-4 gap-2 text-[10px] font-bold uppercase tracking-wider text-tdds-400 pb-2 border-b border-tdds-100">
        <div>Cycle</div>
        <div className="text-right">Wholesale ASP</div>
        <div className="text-right">List ASP</div>
        <div className="text-right">Discount</div>
      </div>
      {history.map(h => {
        const discount = ((h.listAvgUsd - h.wholesaleAvgUsd) / h.listAvgUsd) * 100
        return (
          <div key={h.cycle} className="grid grid-cols-4 gap-2 py-2 text-[12px] tabular-nums border-b border-tdds-100/50">
            <div>
              <div className="font-semibold text-tdds-900">{h.device}</div>
              <div className="text-[10px] text-tdds-400 font-medium uppercase tracking-wider">{h.cycle}</div>
            </div>
            <div className="text-right text-tdds-900 font-semibold">${h.wholesaleAvgUsd}</div>
            <div className="text-right text-tdds-700">${h.listAvgUsd}</div>
            <div className="text-right text-tdds-500">{discount.toFixed(1)}%</div>
          </div>
        )
      })}
      <div className="pt-2 text-[11px] text-tdds-500 leading-relaxed">
        Wholesale ASP up{' '}
        <span className="font-semibold text-tdds-700">
          {(((history[history.length - 1].wholesaleAvgUsd - history[0].wholesaleAvgUsd) / history[0].wholesaleAvgUsd) * 100).toFixed(1)}%
        </span>{' '}
        over three cycles, outpacing sell-through growth.
      </div>
    </div>
  )
}

// ─── MDF + promo table ──────────────────────────────────────────

function MdfPromoTable({ history }: { history: typeof GOOGLE_HISTORY }) {
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-4 gap-2 text-[10px] font-bold uppercase tracking-wider text-tdds-400 pb-2 border-b border-tdds-100">
        <div>Cycle</div>
        <div className="text-right">MDF</div>
        <div className="text-right">Promo support</div>
        <div className="text-right">Co-fund %</div>
      </div>
      {history.map(h => (
        <div key={h.cycle} className="grid grid-cols-4 gap-2 py-2 text-[12px] tabular-nums border-b border-tdds-100/50">
          <div>
            <div className="font-semibold text-tdds-900">{h.device}</div>
            <div className="text-[10px] text-tdds-400 font-medium uppercase tracking-wider">{h.cycle}</div>
          </div>
          <div className="text-right text-tdds-900 font-semibold">{formatMoney(h.mdfM * 1_000_000, { decimals: 1 })}</div>
          <div className="text-right text-tdds-700">{formatMoney(h.promoSupportM * 1_000_000, { decimals: 1 })}</div>
          <div className="text-right text-tdds-500">{h.promoCofundPct}%</div>
        </div>
      ))}
      <div className="pt-2 text-[11px] text-tdds-500 leading-relaxed">
        Co-fund has held at <span className="font-semibold text-tdds-700">50–52%</span> across three cycles.
      </div>
    </div>
  )
}

// ─── Last cycle table ──────────────────────────────────────────

function LastCycleTable() {
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-tdds-400 pb-2 border-b border-tdds-100">
        <div className="col-span-3">Lever</div>
        <div className="col-span-4">Our ask</div>
        <div className="col-span-4">Where we landed</div>
        <div className="col-span-1 text-right">Value</div>
      </div>
      {PIXEL_9_NEGOTIATION_OUTCOME.leverOutcomes.map((l, i) => (
        <div key={i} className="grid grid-cols-12 gap-2 py-2 text-[12px] border-b border-tdds-100/50">
          <div className="col-span-3 font-semibold text-tdds-900">{l.lever}</div>
          <div className="col-span-4 text-tdds-600">{l.ask}</div>
          <div className="col-span-4 text-tdds-900 font-medium">{l.landed}</div>
          <div className="col-span-1 text-right text-success font-semibold tabular-nums">+{formatMoney(l.valueM * 1_000_000, { decimals: 1 })}</div>
        </div>
      ))}
      <div className="pt-2 text-[11px] text-tdds-500 leading-relaxed">
        Cycle ran <span className="font-semibold text-tdds-700">{PIXEL_9_NEGOTIATION_OUTCOME.cycleDurationDays} days</span>. Total uplift over opening proposal: <span className="font-semibold text-success">{PIXEL_9_NEGOTIATION_OUTCOME.upliftPct.toFixed(1)}%</span>.
      </div>
    </div>
  )
}

// ─── EIP table ──────────────────────────────────────────────────

function EipTable() {
  const total = GOOGLE_EIP_ROLLOFF.reduce((s, e) => s + e.unitsK, 0)
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-tdds-400 pb-2 border-b border-tdds-100">
        <div className="col-span-4">Device coming off EIP</div>
        <div className="col-span-3 text-right">Units</div>
        <div className="col-span-2 text-right">Avg age</div>
        <div className="col-span-3 text-right">Upgrade intent</div>
      </div>
      {GOOGLE_EIP_ROLLOFF.map(e => {
        const pctOfTotal = (e.unitsK / total) * 100
        return (
          <div key={e.device} className="grid grid-cols-12 gap-2 py-2 text-[12px] border-b border-tdds-100/50 items-center">
            <div className="col-span-4 flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5 text-tdds-400 shrink-0" strokeWidth={1.85} />
              <span className="font-semibold text-tdds-900">{e.device}</span>
            </div>
            <div className="col-span-3 text-right tabular-nums">
              <span className="font-semibold text-tdds-900">{e.unitsK}K</span>
              <span className="text-tdds-400 text-[11px] ml-1.5">{pctOfTotal.toFixed(0)}%</span>
            </div>
            <div className="col-span-2 text-right tabular-nums text-tdds-600">{e.avgAgeMonths} mo</div>
            <div className="col-span-3 text-right">
              <div className="inline-flex items-center gap-1.5">
                <div className="w-16 h-1.5 bg-tdds-100 rounded-full overflow-hidden">
                  <div className="h-full bg-magenta-500 rounded-full" style={{ width: `${e.upgradeIntentPct}%` }} />
                </div>
                <span className="text-[11px] font-semibold tabular-nums text-tdds-700 w-8 text-right">{e.upgradeIntentPct}%</span>
              </div>
            </div>
          </div>
        )
      })}
      <div className="grid grid-cols-12 gap-2 pt-3 text-[12px] font-semibold border-t-2 border-tdds-300">
        <div className="col-span-4 text-tdds-900">Total · ready to upgrade</div>
        <div className="col-span-3 text-right tabular-nums text-tdds-900">{total}K</div>
        <div className="col-span-2 text-right text-tdds-400">—</div>
        <div className="col-span-3 text-right tabular-nums text-magenta-600">
          ~{GOOGLE_DEMAND_SYNTHESIS.upgradeCaptureK}K likely
        </div>
      </div>
    </div>
  )
}
