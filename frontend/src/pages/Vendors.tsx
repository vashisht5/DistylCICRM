/**
 * Vendors — portfolio of active device-procurement vendors.
 * Click a vendor row to enter its active negotiation.
 */

import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { PageHeader, Card, Badge } from '@/components/ui'
import { VENDORS } from '@/lib/demo/supportingData'
import { NEGOTIATIONS_INDEX } from '@/lib/demo/pixel10'
import { cn, formatMoney, type Tone } from '@/lib/utils'

const CATEGORY_LABEL = { core: 'Core', flagship: 'Flagship', 'tier-two': 'Tier two' } as const

export default function Vendors() {
  const navigate = useNavigate()
  const totalSpend = VENDORS.reduce((s, v) => s + v.annualSpendBnUsd, 0)

  return (
    <div className="px-10 py-8 max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="Vendor portfolio"
        title="Vendors — device category"
        description="Five vendors carry the active Q1 2026 cycle. Total category external spend ≈ $10.6B."
        meta={
          <>
            <span><strong className="text-tdds-900 font-semibold">{VENDORS.length}</strong> vendors</span>
            <span className="text-tdds-300">·</span>
            <span><strong className="text-tdds-900 font-semibold">${totalSpend.toFixed(1)}B</strong> annual spend</span>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {VENDORS.map(v => {
          const neg = NEGOTIATIONS_INDEX.find(n => n.vendor.name === v.name)
          const exposureTone: Tone = v.exposureTone
          return (
            <Card key={v.id} interactive className="p-5" onClick={() => neg && navigate(`/negotiations/${neg.id}`)}>
              <div className="flex items-start gap-3 mb-4">
                <div className={cn(
                  'w-10 h-10 rounded-sm grid place-items-center font-display font-extrabold text-base shrink-0',
                  v.name === 'Google' ? 'bg-magenta-500 text-white' : 'bg-tdds-900 text-white',
                )}>
                  {v.logoMark}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-base font-bold text-tdds-900 tracking-tight leading-tight">{v.name}</div>
                  <div className="text-[11px] text-tdds-500 mt-0.5 font-medium">{CATEGORY_LABEL[v.category]} · {v.hq}</div>
                </div>
                <Badge tone={exposureTone} variant="dot" uppercase>
                  {v.exposureTone} exposure
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <Metric label="Annual spend" value={`$${v.annualSpendBnUsd.toFixed(2)}B`} />
                <Metric label="Active negotiations" value={v.activeNegotiations.toString()} />
              </div>

              <div className="space-y-2 mb-3 pb-3 border-b border-tdds-100">
                <Field label="Posture" value={v.posture} />
                <Field label="Risk notes" value={v.riskNotes} />
              </div>

              {neg && (
                <div className="flex items-baseline justify-between">
                  <div className="text-[11px] text-tdds-500">
                    <span className="font-semibold text-tdds-900">{neg.device}</span> · {neg.cycle}
                    <span className="ml-2 tabular-nums">
                      <span className="text-tdds-700">{formatMoney(neg.proposedCmM * 1_000_000, { decimals: 1 })}</span>
                      <span className="text-tdds-400 mx-1">CM</span>
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-tdds-400" strokeWidth={1.85} />
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="eyebrow mb-1">{label}</div>
      <div className="font-display font-bold text-tdds-900 text-base tabular-nums tracking-tight">{value}</div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-[12px]">
      <span className="eyebrow mr-1.5">{label}</span>
      <span className="text-tdds-700 leading-relaxed">{value}</span>
    </div>
  )
}
