/**
 * War Game home — entry point listing scenarios across deals.
 *
 * Right now Monte Carlo runs inside a specific Deal Room (since each
 * simulation is bound to one vendor's lever set). This page is the
 * launcher.
 */

import { useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight, Dices } from 'lucide-react'
import { PageHeader, Card, Button, Badge } from '@/components/ui'
import { NEGOTIATIONS_INDEX } from '@/lib/demo/pixel10'
import { cn, formatMoney } from '@/lib/utils'

export default function WarGameHome() {
  const navigate = useNavigate()

  return (
    <div className="px-10 py-8 max-w-[1200px] mx-auto">
      <PageHeader
        eyebrow="Scenario simulation"
        title="War game"
        description="Monte Carlo across each active vendor cycle. Each run samples levers from their uncertainty ranges and shows the distribution of likely Contribution Margin outcomes."
      />

      {/* Method note */}
      <Card className="mb-8">
        <div className="p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-sm bg-magenta-50 text-magenta-600 grid place-items-center shrink-0">
            <Sparkles className="w-5 h-5" strokeWidth={1.85} />
          </div>
          <div>
            <div className="font-display font-bold text-tdds-900 text-base tracking-tight">How the simulator works</div>
            <p className="text-[13px] text-tdds-600 mt-1 leading-relaxed">
              For each scenario, every lever is sampled from its [min, max] range using a triangular distribution
              centered on the current counter-offer. The output is a distribution of CM outcomes —
              <span className="text-tdds-900 font-semibold"> P10 / P50 / P90 </span>
              — plus best / worst cases and the probability of meeting the internal target.
            </p>
            <p className="text-[12px] text-tdds-500 mt-2">
              Click any vendor below to open its Deal Room and run scenarios.
            </p>
          </div>
        </div>
      </Card>

      <div className="eyebrow mb-3">Active cycles · run scenarios on any</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {NEGOTIATIONS_INDEX.map(n => {
          const isHero = n.id === 'pixel-10-q1-2026'
          return (
            <Card key={n.id} interactive className="p-5" onClick={() => navigate(`/negotiations/${n.id}`)}>
              <div className="flex items-start gap-3 mb-3">
                <div className={cn(
                  'w-10 h-10 rounded-sm grid place-items-center font-display font-extrabold text-base shrink-0',
                  isHero ? 'bg-magenta-500 text-white' : 'bg-tdds-900 text-white',
                )}>
                  {n.vendor.logoMark}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-tdds-900 text-[14px] tracking-tight">{n.vendor.name}</div>
                  <div className="text-[11px] text-tdds-500 mt-0.5">{n.device} · {n.cycle}</div>
                </div>
                {isHero && <Badge tone="brand" variant="solid" uppercase>Live</Badge>}
              </div>
              <div className="flex items-center justify-between text-[12px] tabular-nums">
                <div>
                  <div className="eyebrow">CM range</div>
                  <div className="mt-1 font-semibold text-tdds-900">
                    {formatMoney(n.baselineCmM * 1_000_000, { decimals: 1 })}
                    <span className="text-tdds-300 mx-1">→</span>
                    <span className="text-magenta-600">{formatMoney(n.proposedCmM * 1_000_000, { decimals: 1 })}</span>
                  </div>
                </div>
                <Button variant="secondary" size="sm" icon={Dices}>Open</Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
