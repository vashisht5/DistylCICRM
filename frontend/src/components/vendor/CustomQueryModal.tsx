/**
 * Custom query modal — chat-style interface for asking historical-data
 * questions of a vendor's procurement history. Quick cuts seed common
 * questions; free-text input opens a draft response.
 */

import { useState, useEffect, useRef } from 'react'
import { X, Sparkles, Send, MessageSquare, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { cn, formatMoney } from '@/lib/utils'

export type QuickCutId =
  | 'sell-through-region'
  | 'returns-nps-sku'
  | 'mdf-efficiency'
  | 'promo-lift-carrier'
  | 'inventory-aging'
  | 'trade-in-by-age'

export interface QuickCut {
  id: QuickCutId
  label: string
  /** Short hint shown in dropdown row */
  hint: string
  /** What the user is asking */
  prompt: string
}

export const QUICK_CUTS: QuickCut[] = [
  {
    id: 'sell-through-region',
    label: 'Sell-through by region',
    hint: 'Last 4 cycles · NA / EMEA / APAC / LATAM',
    prompt: 'How has Google Pixel sell-through varied by region over the last 4 cycles?',
  },
  {
    id: 'returns-nps-sku',
    label: 'Returns & NPS by SKU',
    hint: 'Pixel 9 vs Pixel 8 — Pro vs standard',
    prompt: 'What were returns rates and NPS scores by SKU for Pixel 9 and Pixel 8?',
  },
  {
    id: 'mdf-efficiency',
    label: 'MDF efficiency',
    hint: '$ spent vs incremental units — vs Samsung benchmark',
    prompt: 'How efficient was last cycle’s MDF spend vs incremental Pixel units sold?',
  },
  {
    id: 'promo-lift-carrier',
    label: 'Promo lift by carrier window',
    hint: 'Last 6 quarters — trade-in vs cash-back vs activation credit',
    prompt: 'Which carrier promo mechanisms produced the strongest lift for Pixel?',
  },
  {
    id: 'inventory-aging',
    label: 'Inventory aging at end-of-cycle',
    hint: 'Distribution by days-on-shelf',
    prompt: 'What was the inventory aging profile at the end of the Pixel 9 cycle?',
  },
  {
    id: 'trade-in-by-age',
    label: 'Trade-in mix by device age',
    hint: 'Buyer-device age distribution at upgrade',
    prompt: 'How does the trade-in mix break down by the age of devices customers traded in?',
  },
]

interface CustomQueryModalProps {
  open: boolean
  onClose: () => void
  /** Initial quick cut to render; null = compose state. */
  initialCutId?: QuickCutId | null
  vendorName: string
}

export function CustomQueryModal({ open, onClose, initialCutId, vendorName }: CustomQueryModalProps) {
  const [activeCutId, setActiveCutId] = useState<QuickCutId | null>(initialCutId ?? null)
  const [draftText, setDraftText] = useState('')
  const [composeMode, setComposeMode] = useState(!initialCutId)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      setActiveCutId(initialCutId ?? null)
      setComposeMode(!initialCutId)
      setDraftText('')
    }
  }, [open, initialCutId])

  useEffect(() => {
    if (open && composeMode) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open, composeMode])

  if (!open) return null

  const activeCut = activeCutId ? QUICK_CUTS.find(q => q.id === activeCutId) ?? null : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-tdds-900/55 backdrop-blur-sm animate-fade-in p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-md ring-1 ring-tdds-200 shadow-lg w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <header className="px-6 py-4 border-b border-tdds-200 flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-magenta-500 shrink-0" strokeWidth={2.25} />
            <h2 className="font-display text-base font-bold text-tdds-900 tracking-tight leading-tight">
              {vendorName} · historical data
            </h2>
          </div>
          <button onClick={onClose} className="text-tdds-400 hover:text-tdds-900 p-1 -m-1 shrink-0" aria-label="Close">
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </header>

        {/* Quick-cut chip rail — always visible, lets users hop between cuts */}
        <div className="px-5 py-3 border-b border-tdds-200 bg-tdds-50/60">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => { setActiveCutId(null); setComposeMode(true) }}
              className={cn(
                'inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-sm transition-colors',
                !activeCut ? 'bg-tdds-900 text-white' : 'bg-white text-tdds-600 ring-1 ring-tdds-200 hover:ring-tdds-300 hover:text-tdds-900',
              )}
            >
              All cuts
            </button>
            <span className="text-tdds-300 text-[11px] px-1">·</span>
            {QUICK_CUTS.map(q => {
              const active = activeCut?.id === q.id
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => { setActiveCutId(q.id); setComposeMode(false) }}
                  className={cn(
                    'px-2.5 py-1 text-[11px] font-semibold rounded-sm transition-colors',
                    active
                      ? 'bg-magenta-500 text-white'
                      : 'bg-white text-tdds-600 ring-1 ring-tdds-200 hover:ring-tdds-300 hover:text-tdds-900',
                  )}
                >
                  {q.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-tdds-50/30">
          {/* Active query response */}
          {activeCut && (
            <>
              <ChatBubble role="user" text={activeCut.prompt} />
              <QueryResponse cut={activeCut} vendorName={vendorName} />
            </>
          )}

          {/* Compose state — show suggestions */}
          {composeMode && !activeCut && (
            <div>
              <ChatBubble role="agent" text={`Ask a question about ${vendorName}'s procurement history, or pick a quick cut to get started.`} />
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                {QUICK_CUTS.map(q => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => { setActiveCutId(q.id); setComposeMode(false) }}
                    className="text-left px-3 py-2.5 bg-white rounded-sm ring-1 ring-tdds-200 hover:ring-magenta-400 transition-colors group"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="font-semibold text-tdds-900 text-[13px] tracking-tight">{q.label}</div>
                      <ArrowRight className="w-3 h-3 text-tdds-300 group-hover:text-magenta-500 transition-colors shrink-0" strokeWidth={2} />
                    </div>
                    <div className="text-[11px] text-tdds-500 mt-0.5">{q.hint}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer — composer */}
        <footer className="px-5 py-4 border-t border-tdds-200 bg-white">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={draftText}
                onChange={e => setDraftText(e.target.value)}
                placeholder={activeCut ? 'Follow up — ask another question…' : `Ask a question about ${vendorName}…`}
                rows={2}
                className="w-full resize-none px-3 py-2 text-[13px] text-tdds-900 placeholder:text-tdds-400 rounded-sm ring-1 ring-tdds-200 focus:ring-magenta-500 focus:outline-none transition-shadow"
              />
            </div>
            <button
              type="button"
              disabled={!draftText.trim()}
              onClick={() => {/* demo no-op */ setDraftText('') }}
              className={cn(
                'h-10 w-10 rounded-sm grid place-items-center transition-colors shrink-0',
                draftText.trim() ? 'bg-magenta-500 text-white hover:bg-magenta-600' : 'bg-tdds-100 text-tdds-400',
              )}
              aria-label="Send query"
            >
              <Send className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
          <div className="text-[10px] text-tdds-400 mt-2 font-medium">
            Queries run against the procurement data warehouse · responses are cached for 6 hours
          </div>
        </footer>
      </div>
    </div>
  )
}

// ─── Chat bubble ──────────────────────────────────────────────

function ChatBubble({ role, text, children }: { role: 'user' | 'agent'; text?: string; children?: React.ReactNode }) {
  return (
    <div className={cn('flex items-start gap-3', role === 'user' ? 'flex-row' : 'flex-row')}>
      <div className={cn(
        'w-7 h-7 rounded-sm grid place-items-center shrink-0 mt-0.5',
        role === 'user' ? 'bg-tdds-900 text-white' : 'bg-magenta-500 text-white',
      )}>
        {role === 'user' ? <MessageSquare className="w-3.5 h-3.5" strokeWidth={2} /> : <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-tdds-500 font-bold mb-1">
          {role === 'user' ? 'You' : 'Procurement Co-Pilot'}
        </div>
        {text && <p className="text-[13px] text-tdds-900 leading-relaxed">{text}</p>}
        {children}
      </div>
    </div>
  )
}

// ─── Per-cut response renderers ───────────────────────────────

function QueryResponse({ cut, vendorName }: { cut: QuickCut; vendorName: string }) {
  return (
    <ChatBubble role="agent">
      <ResponseBody cut={cut} vendorName={vendorName} />
    </ChatBubble>
  )
}

function ResponseBody({ cut, vendorName }: { cut: QuickCut; vendorName: string }) {
  switch (cut.id) {
    case 'sell-through-region': return <SellThroughRegionResponse vendorName={vendorName} />
    case 'returns-nps-sku':     return <ReturnsNpsSkuResponse />
    case 'mdf-efficiency':      return <MdfEfficiencyResponse />
    case 'promo-lift-carrier':  return <PromoLiftCarrierResponse />
    case 'inventory-aging':     return <InventoryAgingResponse />
    case 'trade-in-by-age':     return <TradeInAgeResponse />
  }
}

// ─── Response: Sell-through by region ─────────────────────────

function SellThroughRegionResponse({ vendorName }: { vendorName: string }) {
  const regions = [
    { name: 'NA',    p7: 68, p8: 73, p9: 71, pAvg: 70.7 },
    { name: 'EMEA',  p7: 64, p8: 70, p9: 68, pAvg: 67.3 },
    { name: 'APAC',  p7: 51, p8: 58, p9: 59, pAvg: 56.0 },
    { name: 'LATAM', p7: 48, p8: 52, p9: 52, pAvg: 50.7 },
  ]
  const max = 100
  return (
    <div className="mt-2 bg-white rounded-sm ring-1 ring-tdds-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-tdds-100">
        <div className="eyebrow">Sell-through by region · last 3 Pixel cycles</div>
      </div>
      <div className="p-4 space-y-2.5">
        {regions.map(r => (
          <div key={r.name} className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-2 text-[11px] font-bold text-tdds-700 tabular-nums">{r.name}</div>
            <div className="col-span-8 flex items-center gap-1">
              {([
                { l: 'P7', v: r.p7, c: 'bg-tdds-300' },
                { l: 'P8', v: r.p8, c: 'bg-tdds-500' },
                { l: 'P9', v: r.p9, c: 'bg-magenta-500' },
              ] as const).map((bar, i) => (
                <div key={i} className="flex-1 flex items-center gap-1.5">
                  <div className="text-[9px] text-tdds-400 font-semibold w-4 tabular-nums">{bar.l}</div>
                  <div className="flex-1 h-3 bg-tdds-50 rounded-[1px] overflow-hidden">
                    <div className={cn('h-full', bar.c)} style={{ width: `${(bar.v / max) * 100}%` }} />
                  </div>
                  <div className="text-[10px] tabular-nums font-semibold text-tdds-700 w-7 text-right">{bar.v}%</div>
                </div>
              ))}
            </div>
            <div className="col-span-2 text-right text-[11px] tabular-nums">
              <span className="text-tdds-400">Avg </span>
              <span className="font-bold text-tdds-900">{r.pAvg.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-tdds-100 bg-tdds-50/50">
        <p className="text-[12px] text-tdds-700 leading-relaxed">
          <span className="font-semibold">NA holds strongest</span> at 71% on Pixel 9, but slipped 2pp from Pixel 8.
          <span className="font-semibold"> APAC and LATAM</span> trail by 12–19pp — sustained gap across three cycles suggests structural promo-mix issue, not a pricing lever.
          Use this to flag {vendorName}’s next cycle ask for region-specific MDF.
        </p>
      </div>
    </div>
  )
}

// ─── Response: Returns & NPS by SKU ───────────────────────────

function ReturnsNpsSkuResponse() {
  const rows = [
    { sku: 'Pixel 9 Pro XL',   nps: 64, returnsPct: 1.9, trend: 'up'   },
    { sku: 'Pixel 9 Pro',      nps: 62, returnsPct: 2.1, trend: 'up'   },
    { sku: 'Pixel 9',          nps: 58, returnsPct: 2.8, trend: 'flat' },
    { sku: 'Pixel 8 Pro',      nps: 55, returnsPct: 3.4, trend: 'flat' },
    { sku: 'Pixel 8',          nps: 49, returnsPct: 4.1, trend: 'down' },
    { sku: 'Pixel 8a',         nps: 51, returnsPct: 3.8, trend: 'down' },
  ] as const
  return (
    <div className="mt-2 bg-white rounded-sm ring-1 ring-tdds-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-tdds-100">
        <div className="eyebrow">Returns & NPS · trailing 12 months</div>
      </div>
      <div className="px-4 py-3">
        <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-tdds-400 pb-2 border-b border-tdds-100">
          <div className="col-span-5">SKU</div>
          <div className="col-span-3 text-right">NPS</div>
          <div className="col-span-3 text-right">Returns</div>
          <div className="col-span-1 text-right">Trend</div>
        </div>
        {rows.map(r => (
          <div key={r.sku} className="grid grid-cols-12 gap-2 py-2 text-[12px] border-b border-tdds-100/50 items-center">
            <div className="col-span-5 font-semibold text-tdds-900">{r.sku}</div>
            <div className="col-span-3 text-right tabular-nums">
              <span className={cn('font-bold', r.nps >= 60 ? 'text-success' : r.nps >= 50 ? 'text-tdds-700' : 'text-warning')}>{r.nps}</span>
            </div>
            <div className="col-span-3 text-right tabular-nums text-tdds-700">{r.returnsPct.toFixed(1)}%</div>
            <div className="col-span-1 text-right">
              {r.trend === 'up' && <TrendingUp className="w-3 h-3 text-success inline" strokeWidth={2.25} />}
              {r.trend === 'down' && <TrendingDown className="w-3 h-3 text-critical inline" strokeWidth={2.25} />}
              {r.trend === 'flat' && <span className="text-tdds-400">·</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-tdds-100 bg-tdds-50/50">
        <p className="text-[12px] text-tdds-700 leading-relaxed">
          <span className="font-semibold">Pro variants beat standard</span> by 7–9 NPS points across both generations, with returns ~1pp lower.
          Pro mix on Pixel 10 is currently 53% — a 5pp shift toward Pro would lift portfolio NPS by ~3 points and reduce returns exposure by ~$1.2M annualized.
        </p>
      </div>
    </div>
  )
}

// ─── Response: MDF efficiency ─────────────────────────────────

function MdfEfficiencyResponse() {
  return (
    <div className="mt-2 bg-white rounded-sm ring-1 ring-tdds-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-tdds-100">
        <div className="eyebrow">MDF efficiency · Pixel 9 cycle vs benchmark</div>
      </div>
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="MDF spent" value={formatMoney(1.8 * 1_000_000, { decimals: 1 })} sub="released by Google" />
        <KpiCard label="Incremental units" value="124K" sub="vs no-MDF counterfactual" />
        <KpiCard label="Cost per incremental" value="$14.50" sub="weighted avg" accent />
        <KpiCard label="Samsung benchmark" value="$11.20" sub="same cycle · S24" tone="muted" />
      </div>
      <div className="px-4 py-3 border-t border-tdds-100 bg-tdds-50/50">
        <p className="text-[12px] text-tdds-700 leading-relaxed">
          <span className="font-semibold">MDF efficiency 23% below Samsung benchmark.</span> Two-thirds of Pixel MDF flowed through carrier-direct channels with no co-funded creative;
          Samsung’s MDF was paired 1:1 with Galaxy Studio retail activations. AI Camera Studio launch creates a natural anchor to renegotiate co-fund terms.
        </p>
      </div>
    </div>
  )
}

// ─── Response: Promo lift by carrier window ───────────────────

function PromoLiftCarrierResponse() {
  const data = [
    { q: 'Q3 24', tradeIn: 9, cashBack: 6, activation: 11 },
    { q: 'Q4 24', tradeIn: 12, cashBack: 7, activation: 13 },
    { q: 'Q1 25', tradeIn: 8, cashBack: 11, activation: 14 },
    { q: 'Q2 25', tradeIn: 11, cashBack: 9, activation: 17 },
    { q: 'Q3 25', tradeIn: 14, cashBack: 8, activation: 19 },
    { q: 'Q4 25', tradeIn: 12, cashBack: 6, activation: 18 },
  ]
  const max = 20
  return (
    <div className="mt-2 bg-white rounded-sm ring-1 ring-tdds-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-tdds-100 flex items-baseline justify-between">
        <div className="eyebrow">Incremental unit lift by promo mechanic · % over baseline</div>
        <div className="flex items-center gap-3 text-[10px] font-medium text-tdds-500">
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-[1px] bg-tdds-700" />Trade-in</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-[1px] bg-tdds-400" />Cash-back</span>
          <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-[1px] bg-magenta-500" />Activation</span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-stretch gap-3 h-36">
          {data.map(d => (
            <div key={d.q} className="flex-1 flex flex-col items-center">
              <div className="flex-1 w-full flex items-end justify-center gap-1 min-h-0">
                <div className="w-1/4 bg-tdds-700 rounded-t-[1px]" style={{ height: `${(d.tradeIn / max) * 100}%` }} title={`Trade-in ${d.tradeIn}%`} />
                <div className="w-1/4 bg-tdds-400 rounded-t-[1px]" style={{ height: `${(d.cashBack / max) * 100}%` }} title={`Cash-back ${d.cashBack}%`} />
                <div className="w-1/4 bg-magenta-500 rounded-t-[1px]" style={{ height: `${(d.activation / max) * 100}%` }} title={`Activation ${d.activation}%`} />
              </div>
              <div className="text-[10px] font-semibold text-tdds-500 tabular-nums mt-1.5">{d.q}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="px-4 py-3 border-t border-tdds-100 bg-tdds-50/50">
        <p className="text-[12px] text-tdds-700 leading-relaxed">
          <span className="font-semibold">Activation credits consistently outperform</span> trade-in and cash-back by 4–8pp across all 6 quarters.
          Trade-in is gaining ground (Q3 25: 14%) — likely Pixel-specific given the EIP roll-off coming. Recommend weighting Pixel 10 promo mix 60% activation, 30% trade-in, 10% cash-back.
        </p>
      </div>
    </div>
  )
}

// ─── Response: Inventory aging ────────────────────────────────

function InventoryAgingResponse() {
  const buckets = [
    { range: '0–30 days',  pct: 62, color: 'bg-success' },
    { range: '30–60 days', pct: 24, color: 'bg-tdds-500' },
    { range: '60–90 days', pct: 10, color: 'bg-warning' },
    { range: '90+ days',   pct: 4,  color: 'bg-critical' },
  ]
  return (
    <div className="mt-2 bg-white rounded-sm ring-1 ring-tdds-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-tdds-100">
        <div className="eyebrow">Inventory aging · Pixel 9 cycle end</div>
      </div>
      <div className="p-4">
        <div className="flex h-8 rounded-sm overflow-hidden ring-1 ring-tdds-100">
          {buckets.map(b => (
            <div key={b.range} className={cn(b.color, 'relative grid place-items-center text-[10px] font-bold text-white')} style={{ width: `${b.pct}%` }} title={`${b.range}: ${b.pct}%`}>
              {b.pct >= 8 && `${b.pct}%`}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2 mt-3">
          {buckets.map(b => (
            <div key={b.range} className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-tdds-500 font-semibold">{b.range}</div>
              <div className="font-display font-bold text-tdds-900 text-base tabular-nums tracking-tight mt-1">{b.pct}%</div>
            </div>
          ))}
        </div>
      </div>
      <div className="px-4 py-3 border-t border-tdds-100 bg-tdds-50/50">
        <p className="text-[12px] text-tdds-700 leading-relaxed">
          <span className="font-semibold">86% cleared within 60 days</span> — healthy turn, but the 4% in the 90+ bucket
          ($340K reclaim exposure) is concentrated in Pixel 9 standard (storage 128GB). Suggests tightening initial allocation on standard SKU for Pixel 10 by 5–8%.
        </p>
      </div>
    </div>
  )
}

// ─── Response: Trade-in by device age ─────────────────────────

function TradeInAgeResponse() {
  const buckets = [
    { range: '<12 mo',     pct: 8,  color: 'bg-tdds-300' },
    { range: '12–24 mo',   pct: 31, color: 'bg-tdds-500' },
    { range: '24–36 mo',   pct: 39, color: 'bg-magenta-500' },
    { range: '36–48 mo',   pct: 16, color: 'bg-tdds-700' },
    { range: '48+ mo',     pct: 6,  color: 'bg-tdds-900' },
  ]
  return (
    <div className="mt-2 bg-white rounded-sm ring-1 ring-tdds-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-tdds-100">
        <div className="eyebrow">Trade-in age mix · Pixel 9 launch quarter</div>
      </div>
      <div className="p-4 space-y-2">
        {buckets.map(b => (
          <div key={b.range} className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-3 text-[11px] font-semibold text-tdds-700">{b.range}</div>
            <div className="col-span-7">
              <div className="h-3 bg-tdds-50 rounded-[1px] overflow-hidden">
                <div className={cn('h-full', b.color)} style={{ width: `${(b.pct / 40) * 100}%` }} />
              </div>
            </div>
            <div className="col-span-2 text-right text-[12px] font-bold tabular-nums text-tdds-900">{b.pct}%</div>
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-tdds-100 bg-tdds-50/50">
        <p className="text-[12px] text-tdds-700 leading-relaxed">
          <span className="font-semibold">70% of trade-ins are 12–36 months old</span> — these are EIP-aligned customers cycling on schedule.
          The 24–36mo bucket maps directly to the 312K Pixel devices coming off EIP this quarter. Pricing Pixel 10 promo against this segment unlocks the most reliable conversion path.
        </p>
      </div>
    </div>
  )
}

// ─── KPI card ──────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent, tone }: { label: string; value: string; sub?: string; accent?: boolean; tone?: 'muted' }) {
  return (
    <div className={cn('rounded-sm ring-1 p-3', accent ? 'ring-magenta-300 bg-magenta-50/40' : 'ring-tdds-200 bg-white')}>
      <div className="eyebrow mb-1.5">{label}</div>
      <div className={cn(
        'font-display font-extrabold tabular-nums leading-none tracking-tight text-[20px]',
        accent ? 'text-magenta-600' : tone === 'muted' ? 'text-tdds-500' : 'text-tdds-900',
      )}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-tdds-500 mt-1.5 font-medium leading-snug">{sub}</div>}
    </div>
  )
}
