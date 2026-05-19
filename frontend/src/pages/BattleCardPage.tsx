/**
 * Battle Card — single-page printable brief. Vendor profile, counterpart
 * bio, recent moves, open/target/walk-away per lever, and opener/closer
 * scripts. Designed to print on one A4 page.
 */

import { Link } from 'react-router-dom'
import { ArrowLeft, Printer, Calendar, MapPin, AlertTriangle, MessageSquareQuote } from 'lucide-react'
import { PIXEL_10_BATTLE_CARD as BC } from '@/lib/demo/battleCard'
import { PIXEL_10 } from '@/lib/demo/pixel10'
import { Button, Badge } from '@/components/ui'
import { cn, formatMoney } from '@/lib/utils'

export default function BattleCardPage() {
  return (
    <div className="px-10 py-8 max-w-[1200px] mx-auto print:px-6 print:py-4 print:max-w-none">
      {/* Top bar — hidden in print */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link to="/negotiations/pixel-10-q1-2026" className="text-[12px] text-tdds-500 hover:text-tdds-900 inline-flex items-center gap-1 font-medium">
          <ArrowLeft className="w-3 h-3" strokeWidth={2} /> Back to Deal Room
        </Link>
        <Button variant="primary" size="md" icon={Printer} onClick={() => window.print()}>Print</Button>
      </div>

      {/* The card itself */}
      <article className="bg-white ring-1 ring-tdds-200 rounded-md print:ring-0 print:rounded-none overflow-hidden">
        {/* Header band */}
        <header className="px-8 py-5 border-b-2 border-tdds-900 flex items-end justify-between gap-6 print:px-6 print:py-3">
          <div className="min-w-0">
            <div className="eyebrow mb-1">Negotiation Battle Card · CONFIDENTIAL</div>
            <h1 className="font-display text-[28px] font-extrabold text-tdds-900 tracking-tight leading-tight">
              {BC.vendor.name} · {BC.device}
            </h1>
            <p className="text-[12px] text-tdds-500 mt-1 inline-flex items-center gap-3">
              <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" /> {BC.cycle}</span>
              <span className="text-tdds-300">·</span>
              <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /> {BC.meetingContext}</span>
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="eyebrow mb-1.5">Our goal</div>
            <div className="font-display text-[40px] font-extrabold text-magenta-500 tabular-nums leading-none tracking-tight">
              {formatMoney(BC.ourGoalCm * 1_000_000, { decimals: 1 })}
            </div>
            <div className="text-[11px] text-tdds-500 mt-1 font-medium">contribution margin</div>
          </div>
        </header>

        {/* Two-column body */}
        <div className="grid grid-cols-12 gap-0 print:gap-0">
          {/* Left column: counterpart + context */}
          <div className="col-span-12 lg:col-span-5 border-r border-tdds-200 px-8 py-6 print:px-6 print:py-4 space-y-6">
            {/* Models under negotiation — the SKU breakdown behind "Pixel 10" */}
            <section>
              <div className="eyebrow mb-2">Models under negotiation</div>
              <div className="border border-tdds-200 rounded-sm overflow-hidden">
                <div className="grid grid-cols-12 gap-1 px-2 py-1.5 bg-tdds-50 border-b border-tdds-200 text-[9px] font-bold uppercase tracking-wider text-tdds-500">
                  <div className="col-span-5">SKU</div>
                  <div className="col-span-3 text-right">Wholesale</div>
                  <div className="col-span-2 text-right">Units</div>
                  <div className="col-span-2 text-right">Mix</div>
                </div>
                {BC.models.map(m => (
                  <div key={m.sku} className="grid grid-cols-12 gap-1 px-2 py-1.5 border-b border-tdds-100 last:border-b-0 text-[11px] items-center">
                    <div className="col-span-5">
                      <div className="font-semibold text-tdds-900 leading-tight">{m.sku}</div>
                      <div className="text-[9px] text-tdds-400 mt-0.5 leading-tight">
                        {m.storage} · {m.colors.length} colors
                      </div>
                    </div>
                    <div className="col-span-3 text-right tabular-nums">
                      <div className="font-semibold text-tdds-900">${m.wholesaleUsd}</div>
                      <div className="text-[9px] text-tdds-400">list ${m.listUsd}</div>
                    </div>
                    <div className="col-span-2 text-right tabular-nums text-tdds-700 font-medium">{m.unitsK}K</div>
                    <div className="col-span-2 text-right">
                      <span className="text-[10px] font-bold tabular-nums text-magenta-600">{m.mixPct}%</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-tdds-500 italic mt-2 leading-snug">
                Lever positions apply to the volume-weighted blended price across these SKUs.
              </p>
            </section>

            {/* Counterpart bio */}
            <section>
              <div className="eyebrow mb-2">Counterpart</div>
              <div className="font-display text-xl font-bold text-tdds-900 tracking-tight leading-tight">{BC.counterpart.name}</div>
              <div className="text-[12px] text-tdds-600 mt-0.5 font-medium">{BC.counterpart.title}</div>
              <div className="text-[11px] text-tdds-500 mt-1">
                {BC.counterpart.tenureYrs} yrs · risk tolerance:
                <span className={cn(
                  'ml-1 font-semibold',
                  BC.counterpart.riskTolerance === 'high' ? 'text-success' :
                  BC.counterpart.riskTolerance === 'medium' ? 'text-warning' : 'text-critical',
                )}>
                  {BC.counterpart.riskTolerance}
                </span>
              </div>
              <p className="text-[12px] text-tdds-700 leading-relaxed mt-3 italic">"{BC.counterpart.decisionStyle}"</p>
            </section>

            <section>
              <div className="eyebrow mb-2">Their priorities</div>
              <ul className="space-y-1.5">
                {BC.counterpart.knownPriorities.map((p, i) => (
                  <li key={i} className="text-[12px] text-tdds-700 leading-relaxed pl-3 relative">
                    <span className="absolute left-0 top-[7px] w-1 h-1 rounded-full bg-magenta-500" />
                    {p}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <div className="eyebrow mb-2">Concessions on record</div>
              <ul className="space-y-1.5">
                {BC.counterpart.knownConcessions.map((c, i) => (
                  <li key={i} className="text-[12px] text-tdds-700 leading-relaxed pl-3 relative">
                    <span className="absolute left-0 top-[7px] w-1 h-1 rounded-full bg-success" />
                    {c}
                  </li>
                ))}
              </ul>
            </section>

            {/* Context — recent moves */}
            <section>
              <div className="eyebrow mb-2">Recent moves</div>
              <div className="space-y-3">
                {BC.context.map((c, i) => (
                  <div key={i} className="text-[12px] leading-relaxed">
                    <p className="text-tdds-900 font-semibold">{c.recentMove}</p>
                    <div className="grid grid-cols-2 gap-3 mt-1.5 text-[11px]">
                      <div>
                        <span className="text-success font-semibold uppercase tracking-wider text-[9px]">Our leverage</span>
                        <p className="text-tdds-600 mt-0.5 leading-snug">{c.ourLeverage}</p>
                      </div>
                      <div>
                        <span className="text-critical font-semibold uppercase tracking-wider text-[9px]">Their leverage</span>
                        <p className="text-tdds-600 mt-0.5 leading-snug">{c.theirLeverage}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right column: lever positions */}
          <div className="col-span-12 lg:col-span-7 px-8 py-6 print:px-6 print:py-4 space-y-5">
            <section>
              <div className="eyebrow mb-2.5">Per-lever positions — open / target / walk-away</div>
              <div className="space-y-3">
                {BC.leverPositions.map(p => {
                  const lever = PIXEL_10.levers.find(l => l.id === p.leverId)
                  if (!lever) return null
                  return (
                    <div key={p.leverId} className="border border-tdds-200 rounded-sm p-3">
                      <div className="flex items-baseline justify-between mb-2">
                        <div className="font-display font-bold text-tdds-900 text-[13px] tracking-tight">{lever.name}</div>
                        <Badge
                          tone={lever.confidence === 'high' ? 'success' : lever.confidence === 'medium' ? 'high' : 'monitor'}
                          variant="dot"
                          uppercase
                        >
                          {lever.confidence}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[11px] leading-snug">
                        <PositionCell label="Open with" value={p.open} tone="brand" />
                        <PositionCell label="Target" value={p.target} tone="success" />
                        <PositionCell label="Walk away" value={p.walkAway} tone="critical" />
                      </div>
                      <p className="text-[11px] text-tdds-500 italic mt-2 leading-snug">{p.rationale}</p>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Openers + closers + red lines */}
            <section className="grid grid-cols-1 gap-3">
              <ScriptBlock
                icon={MessageSquareQuote}
                label="Openers"
                items={BC.openersAndCloses.openers}
                tone="brand"
              />
              <ScriptBlock
                icon={MessageSquareQuote}
                label="Closers"
                items={BC.openersAndCloses.closers}
                tone="success"
              />
              <ScriptBlock
                icon={AlertTriangle}
                label="Red lines — do not concede"
                items={BC.openersAndCloses.redLines}
                tone="critical"
              />
            </section>
          </div>
        </div>

        {/* Footer band */}
        <footer className="px-8 py-3 border-t border-tdds-200 bg-tdds-50 text-[10px] text-tdds-500 font-medium uppercase tracking-wider flex justify-between print:px-6">
          <span>Procurement Co-Pilot · Confidential</span>
          <span>For internal negotiation use only</span>
          <span>v{BC.cycle} · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </footer>
      </article>
    </div>
  )
}

function PositionCell({ label, value, tone }: { label: string; value: string; tone: 'brand' | 'success' | 'critical' }) {
  const colorClass =
    tone === 'brand' ? 'text-magenta-600 ring-magenta-200 bg-magenta-50' :
    tone === 'success' ? 'text-success ring-success/25 bg-success/8' :
    'text-critical ring-critical/25 bg-critical/8'
  return (
    <div className={cn('rounded-sm p-2 ring-1 ring-inset', colorClass)}>
      <div className="font-semibold uppercase tracking-wider text-[9px] mb-0.5 opacity-80">{label}</div>
      <div className="text-tdds-900 font-medium leading-snug">{value}</div>
    </div>
  )
}

function ScriptBlock({ icon: Icon, label, items, tone }: { icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>; label: string; items: string[]; tone: 'brand' | 'success' | 'critical' }) {
  const iconColor =
    tone === 'brand' ? 'text-magenta-500' :
    tone === 'success' ? 'text-success' : 'text-critical'
  return (
    <div className="border border-tdds-200 rounded-sm p-3 bg-tdds-50/50">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className={cn('w-3.5 h-3.5', iconColor)} strokeWidth={2.25} />
        <div className="eyebrow">{label}</div>
      </div>
      <ul className="space-y-1.5">
        {items.map((s, i) => (
          <li key={i} className="text-[12px] text-tdds-800 leading-relaxed">"{s}"</li>
        ))}
      </ul>
    </div>
  )
}
