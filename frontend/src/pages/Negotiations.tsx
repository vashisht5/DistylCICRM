/**
 * Negotiations — home screen.
 *
 * Dashboard view of every active vendor negotiation in the device portfolio.
 * Every row leads with the dollar number, because Mike Simpson does.
 */

import { useNavigate } from 'react-router-dom'
import { ArrowRight, Clock, Target } from 'lucide-react'
import { PageHeader, Card, Badge, Button } from '@/components/ui'
import { NEGOTIATIONS_INDEX, STATUS_LABEL, type Negotiation } from '@/lib/demo/pixel10'
import { cn, formatMoney, formatRelative, type Tone } from '@/lib/utils'

const STATUS_TONE: Record<Negotiation['status'], Tone> = {
  proposal_received: 'high',
  in_analysis:       'brand',
  counter_drafted:   'medium',
  in_negotiation:    'high',
  closed_won:        'success',
  closed_lost:       'critical',
}

export default function Negotiations() {
  const navigate = useNavigate()

  // Portfolio totals
  const totalBaseline = NEGOTIATIONS_INDEX.reduce((sum, n) => sum + n.baselineCmM, 0)
  const totalProposed = NEGOTIATIONS_INDEX.reduce((sum, n) => sum + n.proposedCmM, 0)
  const totalTarget   = NEGOTIATIONS_INDEX.reduce((sum, n) => sum + n.targetCmM, 0)
  const portfolioDeltaM  = totalProposed - totalBaseline
  const portfolioUnclaimedM = totalTarget - totalProposed
  const unitsTotalM = NEGOTIATIONS_INDEX.reduce((sum, n) => sum + n.unitsM, 0)

  return (
    <div className="px-10 py-8 max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="Q1 2026 cycle"
        title="Device Procurement — Active Negotiations"
        description="Five active vendor cycles. Devices is the single largest external-spend category."
        meta={
          <>
            <span><strong className="text-tdds-900 font-semibold">{NEGOTIATIONS_INDEX.length}</strong> active</span>
            <span className="text-tdds-300">·</span>
            <span><strong className="text-tdds-900 font-semibold">{unitsTotalM.toFixed(1)}M</strong> units in play</span>
            <span className="text-tdds-300">·</span>
            <span>Updated {formatRelative('2026-05-15T14:00:00Z')}</span>
          </>
        }
        actions={<Button variant="primary" size="md" iconRight={ArrowRight} onClick={() => navigate('/negotiations/pixel-10-q1-2026')}>Open Pixel 10 Deal Room</Button>}
      />

      {/* Portfolio impact bar */}
      <div className="grid grid-cols-12 gap-4 mb-8">
        {/* Headline figures — pure display, no chrome */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-md ring-1 ring-tdds-200 p-6">
          <div className="eyebrow mb-3">Contribution margin across all active cycles</div>
          <div className="flex items-end gap-10 flex-wrap">
            <Headline
              eyebrow="Baseline (vendor proposals as-is)"
              value={formatMoney(totalBaseline * 1_000_000, { decimals: 1 })}
              sub="If we accept everything they sent"
            />
            <Arrow />
            <Headline
              eyebrow="Counter-offer in flight"
              value={formatMoney(totalProposed * 1_000_000, { decimals: 1 })}
              accent
              sub={`+${formatMoney(portfolioDeltaM * 1_000_000, { sign: false })} captureable`}
            />
            <Arrow />
            <Headline
              eyebrow="Internal target"
              value={formatMoney(totalTarget * 1_000_000, { decimals: 1 })}
              sub={portfolioUnclaimedM > 0 ? `${formatMoney(portfolioUnclaimedM * 1_000_000)} left on the table` : 'on track'}
              tone="muted"
            />
          </div>
        </div>

        {/* Cycle clock + next move */}
        <div className="col-span-12 lg:col-span-4 bg-tdds-900 text-white rounded-md p-6 flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-tdds-400 mb-3">Next move</div>
            <div className="font-display text-2xl font-bold leading-tight">Pixel 10 counter-offer</div>
            <div className="text-tdds-300 text-sm mt-1">Google · 12 days to close</div>
          </div>
          <div className="flex items-baseline gap-2 mt-5">
            <Clock className="w-4 h-4 text-magenta-400" strokeWidth={2} />
            <span className="text-[11px] uppercase tracking-wider text-tdds-300 font-semibold">CPO review scheduled</span>
            <span className="text-[11px] text-tdds-400 ml-auto">w/o May 11</span>
          </div>
        </div>
      </div>

      {/* Negotiations table */}
      <Card>
        <div className="px-5 py-3 border-b border-tdds-200 flex items-center justify-between">
          <div className="eyebrow">All active negotiations</div>
          <div className="text-[11px] text-tdds-500 font-medium">Sorted by days to close</div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] font-semibold uppercase tracking-wider text-tdds-500 bg-tdds-50">
              <th className="text-left px-5 py-2.5 font-semibold">Vendor</th>
              <th className="text-left px-3 py-2.5 font-semibold">Status</th>
              <th className="text-right px-3 py-2.5 font-semibold">Units</th>
              <th className="text-right px-3 py-2.5 font-semibold">Baseline CM</th>
              <th className="text-right px-3 py-2.5 font-semibold">Counter</th>
              <th className="text-right px-3 py-2.5 font-semibold">Target</th>
              <th className="text-right px-3 py-2.5 font-semibold">Δ vs. baseline</th>
              <th className="text-right px-3 py-2.5 font-semibold">Closes</th>
              <th className="px-5 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tdds-100">
            {[...NEGOTIATIONS_INDEX].sort((a, b) => a.daysToClose - b.daysToClose).map(n => {
              const delta = (n.proposedCmM - n.baselineCmM) * 1_000_000
              const isHero = n.id === 'pixel-10-q1-2026'
              const isUrgent = n.daysToClose <= 7
              return (
                <tr
                  key={n.id}
                  onClick={() => navigate(`/negotiations/${n.id}`)}
                  className={cn(
                    'cursor-pointer transition-colors group',
                    isHero ? 'bg-magenta-50/40 hover:bg-magenta-50' : 'hover:bg-tdds-50',
                  )}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-sm grid place-items-center font-display font-extrabold text-sm',
                        isHero ? 'bg-magenta-500 text-white' : 'bg-tdds-900 text-white',
                      )}>
                        {n.vendor.logoMark}
                      </div>
                      <div>
                        <div className="font-semibold text-tdds-900 leading-tight">{n.vendor.name}</div>
                        <div className="text-[12px] text-tdds-500 leading-tight mt-0.5">{n.device} · {n.cycle}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <Badge tone={STATUS_TONE[n.status]} variant="dot">{STATUS_LABEL[n.status]}</Badge>
                  </td>
                  <td className="px-3 py-3.5 text-right tabular-nums text-tdds-700">{n.unitsM.toFixed(2)}M</td>
                  <td className="px-3 py-3.5 text-right tabular-nums text-tdds-700">{formatMoney(n.baselineCmM * 1_000_000, { decimals: 1 })}</td>
                  <td className={cn('px-3 py-3.5 text-right tabular-nums font-semibold', isHero ? 'text-magenta-600' : 'text-tdds-900')}>
                    {formatMoney(n.proposedCmM * 1_000_000, { decimals: 1 })}
                  </td>
                  <td className="px-3 py-3.5 text-right tabular-nums text-tdds-500">{formatMoney(n.targetCmM * 1_000_000, { decimals: 1 })}</td>
                  <td className="px-3 py-3.5 text-right tabular-nums">
                    {delta > 0 ? (
                      <span className="text-success font-semibold">+{formatMoney(delta, { decimals: 1 })}</span>
                    ) : delta < 0 ? (
                      <span className="text-critical font-semibold">{formatMoney(delta, { decimals: 1 })}</span>
                    ) : (
                      <span className="text-tdds-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <div className="inline-flex items-baseline gap-1 tabular-nums">
                      <span className={cn('font-semibold', isUrgent ? 'text-critical' : 'text-tdds-700')}>{n.daysToClose}</span>
                      <span className="text-[11px] text-tdds-500">days</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <ArrowRight className="w-4 h-4 text-tdds-300 group-hover:text-tdds-900 transition-colors inline" strokeWidth={1.85} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Card>

      {/* Footnote */}
      <p className="mt-6 text-[11px] text-tdds-400 leading-relaxed max-w-2xl">
        <Target className="inline w-3 h-3 -mt-0.5 mr-1" strokeWidth={2} />
        Figures derived from predecessor-device sell-through patterns and current vendor proposals.
      </p>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────

function Headline({ eyebrow, value, sub, accent, tone }: { eyebrow: string; value: string; sub?: string; accent?: boolean; tone?: 'muted' }) {
  return (
    <div className="min-w-0">
      <div className="eyebrow mb-1.5">{eyebrow}</div>
      <div className={cn(
        'font-display font-extrabold tabular-nums leading-none text-[40px] tracking-tight',
        accent ? 'text-magenta-500' : tone === 'muted' ? 'text-tdds-500' : 'text-tdds-900',
      )}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-tdds-500 mt-2 font-medium">{sub}</div>}
    </div>
  )
}

function Arrow() {
  return <ArrowRight className="w-5 h-5 text-tdds-300 self-end mb-3 shrink-0" strokeWidth={1.5} />
}
