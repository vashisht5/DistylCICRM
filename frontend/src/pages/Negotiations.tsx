/**
 * Negotiations — portfolio view across active RFPs.
 */

import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Clock, ChevronDown, Check, FileText, Calendar } from 'lucide-react'
import { PageHeader, Card, Badge, Button } from '@/components/ui'
import { NEGOTIATIONS_INDEX, RFPS, STATUS_LABEL, type Negotiation, type Rfp } from '@/lib/demo/pixel10'
import { cn, formatMoney, formatRelative, type Tone } from '@/lib/utils'

const STATUS_TONE: Record<Negotiation['status'], Tone> = {
  proposal_received: 'high',
  in_analysis:       'brand',
  counter_drafted:   'medium',
  in_negotiation:    'high',
  closed_won:        'success',
  closed_lost:       'critical',
}

const ALL_RFPS_OPTION: Rfp = {
  id: '__all__',
  code: 'ALL',
  name: 'All active RFPs',
  priceBand: 'All bands',
  cycle: 'Q1 2026',
  closesOn: '',
}

export default function Negotiations() {
  const navigate = useNavigate()

  // Default to the Pixel 10 RFP — that's the cycle most users will be reviewing
  const [selectedRfpId, setSelectedRfpId] = useState<string>('rfp-premium-q1-2026')

  const selectedRfp = selectedRfpId === ALL_RFPS_OPTION.id
    ? ALL_RFPS_OPTION
    : RFPS.find(r => r.id === selectedRfpId) ?? ALL_RFPS_OPTION

  const filteredNegotiations = useMemo(
    () => selectedRfpId === ALL_RFPS_OPTION.id
      ? NEGOTIATIONS_INDEX
      : NEGOTIATIONS_INDEX.filter(n => n.rfpId === selectedRfpId),
    [selectedRfpId],
  )

  // Portfolio totals — within the selected RFP scope
  const totalBaseline = filteredNegotiations.reduce((sum, n) => sum + n.baselineCmM, 0)
  const totalProposed = filteredNegotiations.reduce((sum, n) => sum + n.proposedCmM, 0)
  const totalTarget   = filteredNegotiations.reduce((sum, n) => sum + n.targetCmM, 0)
  const portfolioDeltaM  = totalProposed - totalBaseline
  const portfolioUnclaimedM = totalTarget - totalProposed
  const unitsTotalM = filteredNegotiations.reduce((sum, n) => sum + n.unitsM, 0)

  const daysToClose = selectedRfp.closesOn
    ? Math.max(0, Math.ceil((new Date(selectedRfp.closesOn).getTime() - new Date('2026-05-26').getTime()) / 86_400_000))
    : null

  return (
    <div className="px-10 py-8 max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="Device category · Q1 2026"
        title="Negotiations"
        meta={
          <>
            <span><strong className="text-tdds-900 font-semibold">{filteredNegotiations.length}</strong> {filteredNegotiations.length === 1 ? 'tender' : 'tenders'}</span>
            <span className="text-tdds-300">·</span>
            <span><strong className="text-tdds-900 font-semibold">{unitsTotalM.toFixed(1)}M</strong> units</span>
            <span className="text-tdds-300">·</span>
            <span>Updated {formatRelative('2026-05-15T14:00:00Z')}</span>
          </>
        }
        actions={<Button variant="primary" size="md" iconRight={ArrowRight} onClick={() => navigate('/negotiations/pixel-10-q1-2026')}>Pixel 10 deal room</Button>}
      />

      {/* RFP context strip — pulldown to switch the RFP under review */}
      <div className="mb-6 bg-white rounded-md ring-1 ring-tdds-200">
        <div className="flex items-stretch divide-x divide-tdds-100">
          {/* RFP picker */}
          <div className="px-5 py-3 flex-1 min-w-0">
            <div className="eyebrow mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3 h-3" strokeWidth={2.25} /> Reviewing RFP
            </div>
            <RfpPicker selected={selectedRfp} onSelect={r => setSelectedRfpId(r.id)} />
          </div>

          {/* Price band */}
          <div className="px-5 py-3 shrink-0">
            <div className="eyebrow mb-1.5">Price band</div>
            <div className="font-display font-bold text-tdds-900 text-sm tabular-nums tracking-tight">{selectedRfp.priceBand}</div>
          </div>

          {/* Close date */}
          {selectedRfp.closesOn && (
            <div className="px-5 py-3 shrink-0">
              <div className="eyebrow mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" strokeWidth={2.25} /> Closes
              </div>
              <div className="flex items-baseline gap-2">
                <div className="font-display font-bold text-tdds-900 text-sm tabular-nums tracking-tight">
                  {new Date(selectedRfp.closesOn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                {daysToClose !== null && (
                  <div className={cn('text-[11px] font-semibold tabular-nums', daysToClose <= 7 ? 'text-critical' : 'text-tdds-500')}>
                    {daysToClose}d
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RFP code */}
          <div className="px-5 py-3 shrink-0 hidden md:block">
            <div className="eyebrow mb-1.5">Tender code</div>
            <div className="font-mono text-[11px] text-tdds-600 font-semibold tracking-tight">{selectedRfp.code}</div>
          </div>
        </div>
      </div>

      {/* Portfolio impact bar */}
      <div className="grid grid-cols-12 gap-4 mb-8">
        {/* Headline figures — pure display, no chrome */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-md ring-1 ring-tdds-200 p-6">
          <div className="eyebrow mb-3">
            Contribution margin {selectedRfpId === ALL_RFPS_OPTION.id ? 'across all active RFPs' : `· ${selectedRfp.name}`}
          </div>
          <div className="flex items-end gap-10 flex-wrap">
            <Headline
              eyebrow="Vendor proposals · as-is"
              value={formatMoney(totalBaseline * 1_000_000, { decimals: 1 })}
            />
            <Arrow />
            <Headline
              eyebrow="With current counter-offers"
              value={formatMoney(totalProposed * 1_000_000, { decimals: 1 })}
              accent
              sub={`+${formatMoney(portfolioDeltaM * 1_000_000, { sign: false })} vs. as-is`}
            />
            <Arrow />
            <Headline
              eyebrow="Internal target"
              value={formatMoney(totalTarget * 1_000_000, { decimals: 1 })}
              sub={portfolioUnclaimedM > 0 ? `${formatMoney(portfolioUnclaimedM * 1_000_000)} remaining` : 'on track'}
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
          <div className="eyebrow">
            {selectedRfpId === ALL_RFPS_OPTION.id ? 'All active negotiations' : `${selectedRfp.name} · vendor tenders`}
          </div>
          <div className="text-[11px] text-tdds-500 font-medium">Sorted by days to close</div>
        </div>
        {filteredNegotiations.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="font-display text-base font-bold text-tdds-900 tracking-tight">No tenders received yet</div>
            <p className="text-[12px] text-tdds-500 mt-1.5">Vendors have until {new Date(selectedRfp.closesOn).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} to submit.</p>
          </div>
        ) : (
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
              {[...filteredNegotiations].sort((a, b) => a.daysToClose - b.daysToClose).map(n => {
                const delta = (n.proposedCmM - n.baselineCmM) * 1_000_000
                const isHero = n.id === 'pixel-10-q1-2026'
                const isProvisioned = n.id === 'pixel-10-q1-2026'
                const isUrgent = n.daysToClose <= 7
                return (
                  <tr
                    key={n.id}
                    onClick={isProvisioned ? () => navigate(`/negotiations/${n.id}`) : undefined}
                    className={cn(
                      'transition-colors group',
                      isProvisioned ? 'cursor-pointer' : 'cursor-default',
                      isHero ? 'bg-magenta-50/40 hover:bg-magenta-50' : isProvisioned ? 'hover:bg-tdds-50' : '',
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
                      {isProvisioned ? (
                        <ArrowRight className="w-4 h-4 text-tdds-300 group-hover:text-tdds-900 transition-colors inline" strokeWidth={1.85} />
                      ) : (
                        <span className="text-[10px] uppercase tracking-wider text-tdds-300 font-semibold">Preview</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

    </div>
  )
}

// ── RFP picker ────────────────────────────────────────────────

function RfpPicker({ selected, onSelect }: { selected: Rfp; onSelect: (r: Rfp) => void }) {
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

  const options: Rfp[] = [ALL_RFPS_OPTION, ...RFPS]
  const negotiationCount = (rfpId: string) => rfpId === ALL_RFPS_OPTION.id
    ? NEGOTIATIONS_INDEX.length
    : NEGOTIATIONS_INDEX.filter(n => n.rfpId === rfpId).length

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'w-full inline-flex items-center justify-between gap-3 px-3 py-2 -mx-3 -my-2 rounded-sm transition-colors text-left',
          'hover:bg-tdds-50',
          open && 'bg-tdds-50',
        )}
      >
        <div className="min-w-0">
          <div className="font-display font-bold text-tdds-900 text-base tracking-tight leading-tight truncate">{selected.name}</div>
          <div className="text-[11px] text-tdds-500 mt-0.5 font-medium">
            {selected.id === ALL_RFPS_OPTION.id ? `${NEGOTIATIONS_INDEX.length} active tenders across ${RFPS.length} RFPs` : `${selected.priceBand} · ${selected.cycle}`}
          </div>
        </div>
        <ChevronDown className={cn('w-4 h-4 text-tdds-500 transition-transform shrink-0', open && 'rotate-180')} strokeWidth={2.25} />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 left-0 right-0 min-w-[420px] bg-white ring-1 ring-tdds-200 rounded-md shadow-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-tdds-100 eyebrow bg-tdds-50">Switch active RFP</div>
          <ul className="py-1 max-h-80 overflow-y-auto">
            {options.map(r => {
              const active = r.id === selected.id
              const count = negotiationCount(r.id)
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => { onSelect(r); setOpen(false) }}
                    className={cn(
                      'w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors',
                      active ? 'bg-magenta-50/60' : 'hover:bg-tdds-50',
                    )}
                  >
                    <div className="w-4 mt-0.5 shrink-0">
                      {active && <Check className="w-4 h-4 text-magenta-500" strokeWidth={2.5} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <div className={cn(
                          'font-semibold text-[13px] tracking-tight leading-tight truncate',
                          active ? 'text-magenta-700' : 'text-tdds-900',
                        )}>
                          {r.name}
                        </div>
                        <div className="text-[10px] font-mono text-tdds-400 shrink-0">{r.code}</div>
                      </div>
                      <div className="text-[11px] text-tdds-500 mt-0.5 font-medium tabular-nums">
                        {r.priceBand} · {count} {count === 1 ? 'tender' : 'tenders'}
                        {r.closesOn && (
                          <span className="text-tdds-400">
                            <span className="mx-1.5">·</span>closes {new Date(r.closesOn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
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
      {/* Reserve sub line so all headlines align on the value baseline */}
      <div className="text-[11px] text-tdds-500 mt-2 font-medium min-h-[1em]">{sub ?? ' '}</div>
    </div>
  )
}

function Arrow() {
  return <ArrowRight className="w-5 h-5 text-tdds-300 self-end mb-3 shrink-0" strokeWidth={1.5} />
}
