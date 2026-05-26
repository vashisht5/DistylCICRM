/**
 * Home — portfolio at a glance.
 */

import { useNavigate } from 'react-router-dom'
import { ArrowRight, Clock, Wind, Calendar, Building2, UserSquare, Layers, Dices } from 'lucide-react'
import { PageHeader, Card, Badge } from '@/components/ui'
import { NEGOTIATIONS_INDEX, STATUS_LABEL, type Negotiation } from '@/lib/demo/pixel10'
import { FEED } from '@/lib/demo/supportingData'
import { VENDORS } from '@/lib/demo/supportingData'
import { STAKEHOLDERS } from '@/lib/demo/supportingData'
import { cn, formatMoney, formatRelative, type Tone } from '@/lib/utils'

const STATUS_TONE: Record<Negotiation['status'], Tone> = {
  proposal_received: 'high',
  in_analysis: 'brand',
  counter_drafted: 'medium',
  in_negotiation: 'high',
  closed_won: 'success',
  closed_lost: 'critical',
}

const UPCOMING = [
  { when: 'Tomorrow · 10:00 AM',  title: 'Pixel 10 counter-offer review',      who: 'CPO + Procurement Lead',   tone: 'brand' as const },
  { when: 'May 28 · 2:00 PM',     title: 'Google in-person — T-Mobile HQ',     who: 'Bellevue · 90 min',        tone: 'high' as const },
  { when: 'May 29 · 5:00 PM',     title: 'Entry-tier RFP closes',              who: 'HTC, TCL · final review',  tone: 'medium' as const },
  { when: 'Jun 2 · 4:00 PM',      title: 'Mid-tier RFP closes',                who: 'Motorola, OPPO, Pixel 9a', tone: 'medium' as const },
]

export default function Overview() {
  const navigate = useNavigate()

  const totalBaseline = NEGOTIATIONS_INDEX.reduce((s, n) => s + n.baselineCmM, 0)
  const totalProposed = NEGOTIATIONS_INDEX.reduce((s, n) => s + n.proposedCmM, 0)
  const totalTarget   = NEGOTIATIONS_INDEX.reduce((s, n) => s + n.targetCmM, 0)
  const recent = [...FEED]
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, 4)
  const nextClose = [...NEGOTIATIONS_INDEX].sort((a, b) => a.daysToClose - b.daysToClose)[0]

  return (
    <div className="px-10 py-8 max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="Device category · Q1 2026"
        title="Home"
        meta={
          <>
            <span><strong className="text-tdds-900 font-semibold">{NEGOTIATIONS_INDEX.length}</strong> active</span>
            <span className="text-tdds-300">·</span>
            <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />Next close in <strong className="text-tdds-900 font-semibold ml-1">{nextClose.daysToClose} days</strong></span>
            <span className="text-tdds-300">·</span>
            <span>Updated {formatRelative('2026-05-19T08:00:00Z')}</span>
          </>
        }
      />

      {/* ── Portfolio CM strip ─────────────────────────────────── */}
      <Card className="mb-8">
        <div className="px-6 py-5 flex items-center gap-10 flex-wrap">
          <Figure
            eyebrow="Vendor proposals · as-is"
            value={formatMoney(totalBaseline * 1_000_000, { decimals: 1 })}
          />
          <ArrowRight className="w-5 h-5 text-tdds-300 shrink-0" strokeWidth={1.5} />
          <Figure
            eyebrow="With current counter-offers"
            value={formatMoney(totalProposed * 1_000_000, { decimals: 1 })}
            accent
            sub={`+${formatMoney((totalProposed - totalBaseline) * 1_000_000, { decimals: 1 })} captured`}
          />
          <ArrowRight className="w-5 h-5 text-tdds-300 shrink-0" strokeWidth={1.5} />
          <Figure
            eyebrow="Internal target"
            value={formatMoney(totalTarget * 1_000_000, { decimals: 1 })}
            muted
            sub={`${formatMoney((totalTarget - totalProposed) * 1_000_000, { decimals: 1 })} remaining`}
          />
          <div className="ml-auto">
            <button
              onClick={() => navigate('/negotiations')}
              className="text-[12px] text-magenta-600 font-semibold inline-flex items-center gap-1 hover:underline"
            >
              All negotiations <ArrowRight className="w-3 h-3" strokeWidth={2} />
            </button>
          </div>
        </div>
      </Card>

      {/* ── Two-column: Upcoming + What changed ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <div className="px-5 py-3 border-b border-tdds-200">
            <div className="eyebrow inline-flex items-center gap-1.5"><Calendar className="w-3 h-3" />Up next</div>
          </div>
          <ul className="divide-y divide-tdds-100">
            {UPCOMING.map(item => (
              <li key={item.title} className="px-5 py-3.5 flex items-start gap-4">
                <div className="w-1 self-stretch rounded-full bg-magenta-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-tdds-500 font-medium">{item.when}</div>
                  <div className="text-[14px] font-semibold text-tdds-900 leading-tight mt-0.5">{item.title}</div>
                  <div className="text-[12px] text-tdds-500 mt-0.5">{item.who}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <div className="px-5 py-3 border-b border-tdds-200 flex items-baseline justify-between">
            <div className="eyebrow inline-flex items-center gap-1.5"><Wind className="w-3 h-3" />Signals · last 24h</div>
            <button
              onClick={() => navigate('/news')}
              className="text-[11px] text-magenta-600 font-semibold hover:underline"
            >
              All news
            </button>
          </div>
          <ul className="divide-y divide-tdds-100">
            {recent.map(item => (
              <li key={item.id} className="px-5 py-3.5 flex items-start gap-3">
                <div className={cn(
                  'w-7 h-7 rounded-sm grid place-items-center font-display font-extrabold text-[11px] shrink-0',
                  item.vendor ? 'bg-tdds-900 text-white' : 'bg-tdds-200 text-tdds-600',
                )}>
                  {VENDORS.find(v => v.name === item.vendor)?.logoMark ?? '·'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    {item.vendor && <span className="text-[11px] font-semibold text-tdds-900">{item.vendor}</span>}
                    <span className="text-tdds-300 text-[11px]">·</span>
                    <span className="text-[11px] text-tdds-500">{formatRelative(item.publishedAt)}</span>
                    <Badge
                      tone={item.bearing === 'tailwind' ? 'success' : item.bearing === 'headwind' ? 'critical' : 'monitor'}
                      variant="dot"
                      uppercase
                    >
                      {item.bearing}
                    </Badge>
                  </div>
                  <div className="text-[13px] text-tdds-900 leading-snug">{item.headline}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* ── Pipeline at a glance ───────────────────────────────── */}
      <Card className="mb-8">
        <div className="px-5 py-3 border-b border-tdds-200 flex items-baseline justify-between">
          <div className="eyebrow">Pipeline</div>
          <button
            onClick={() => navigate('/negotiations')}
            className="text-[11px] text-magenta-600 font-semibold hover:underline"
          >
            Full table
          </button>
        </div>
        <ul className="divide-y divide-tdds-100">
          {[...NEGOTIATIONS_INDEX].sort((a, b) => a.daysToClose - b.daysToClose).map(n => {
            const delta = n.proposedCmM - n.baselineCmM
            const isHero = n.id === 'pixel-10-q1-2026'
            const isProvisioned = n.id === 'pixel-10-q1-2026'
            const isUrgent = n.daysToClose <= 7
            return (
              <li
                key={n.id}
                onClick={isProvisioned ? () => navigate(`/negotiations/${n.id}`) : undefined}
                className={cn(
                  'px-5 py-3 flex items-center gap-4 transition-colors group',
                  isProvisioned ? 'cursor-pointer' : 'cursor-default',
                  isHero ? 'bg-magenta-50/40 hover:bg-magenta-50' : isProvisioned ? 'hover:bg-tdds-50' : '',
                )}
              >
                <div className={cn(
                  'w-9 h-9 rounded-sm grid place-items-center font-display font-extrabold text-[14px] shrink-0',
                  isHero ? 'bg-magenta-500 text-white' : 'bg-tdds-900 text-white',
                )}>
                  {n.vendor.logoMark}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-tdds-900 text-[14px] leading-tight">{n.vendor.name} · {n.device}</div>
                  <div className="text-[11px] text-tdds-500 mt-0.5">{n.cycle} · {n.unitsM.toFixed(2)}M units</div>
                </div>
                <Badge tone={STATUS_TONE[n.status]} variant="dot">{STATUS_LABEL[n.status]}</Badge>
                <div className="text-right tabular-nums w-28">
                  <div className={cn('text-[14px] font-semibold leading-tight', isHero ? 'text-magenta-600' : 'text-tdds-900')}>
                    {formatMoney(n.proposedCmM * 1_000_000, { decimals: 1 })}
                  </div>
                  <div className="text-[11px] text-success font-medium leading-tight">
                    {delta > 0 ? `+${formatMoney(delta * 1_000_000, { decimals: 1 })}` : '—'}
                  </div>
                </div>
                <div className="text-right tabular-nums w-16 shrink-0">
                  <div className={cn('text-[14px] font-semibold leading-tight', isUrgent ? 'text-critical' : 'text-tdds-700')}>
                    {n.daysToClose}d
                  </div>
                  <div className="text-[10px] text-tdds-400 font-medium uppercase tracking-wider mt-0.5">to close</div>
                </div>
                {isProvisioned ? (
                  <ArrowRight className="w-4 h-4 text-tdds-300 group-hover:text-tdds-900 transition-colors shrink-0" strokeWidth={1.85} />
                ) : (
                  <span className="text-[10px] uppercase tracking-wider text-tdds-300 font-semibold shrink-0">Preview</span>
                )}
              </li>
            )
          })}
        </ul>
      </Card>

      {/* ── Quick links to other sections ──────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickLink
          icon={Building2}
          label="Vendors"
          count={`${VENDORS.length}`}
          sub={`$${VENDORS.reduce((s, v) => s + v.annualSpendBnUsd, 0).toFixed(1)}B annual spend`}
          onClick={() => navigate('/vendors')}
        />
        <QuickLink
          icon={UserSquare}
          label="Stakeholders"
          count={`${STAKEHOLDERS.length}`}
          sub={`${STAKEHOLDERS.filter(s => s.side === 'internal').length} internal · ${STAKEHOLDERS.filter(s => s.side === 'vendor').length} vendor`}
          onClick={() => navigate('/stakeholders')}
        />
        <QuickLink
          icon={Layers}
          label="Battle cards"
          count="1"
          sub="Pixel 10 · ready"
          onClick={() => navigate('/battle-cards')}
        />
        <QuickLink
          icon={Dices}
          label="War game"
          count={`${NEGOTIATIONS_INDEX.length}`}
          sub="Monte Carlo · 1,000 runs"
          onClick={() => navigate('/wargame')}
        />
      </div>
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────

function Figure({ eyebrow, value, sub, accent, muted }: { eyebrow: string; value: string; sub?: string; accent?: boolean; muted?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="eyebrow mb-1.5">{eyebrow}</div>
      <div className={cn(
        'font-display font-extrabold tabular-nums leading-none text-[34px] tracking-tight',
        accent ? 'text-magenta-500' : muted ? 'text-tdds-500' : 'text-tdds-900',
      )}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-tdds-500 mt-2 font-medium">{sub}</div>}
    </div>
  )
}

function QuickLink({
  icon: Icon, label, count, sub, onClick,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>
  label: string
  count: string
  sub: string
  onClick: () => void
}) {
  return (
    <Card interactive className="p-4" onClick={onClick}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-sm bg-tdds-100 text-tdds-700 grid place-items-center shrink-0">
          <Icon className="w-4 h-4" strokeWidth={1.85} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-tdds-900 text-[13px] tracking-tight leading-tight">{label}</div>
        </div>
        <div className="font-display font-extrabold text-tdds-900 text-[18px] tabular-nums tracking-tight">{count}</div>
      </div>
      <div className="text-[11px] text-tdds-500 leading-snug">{sub}</div>
    </Card>
  )
}
