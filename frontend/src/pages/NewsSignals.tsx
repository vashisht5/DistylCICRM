/**
 * News & Signals — vendor-tagged feed.
 *
 * What the AI is watching across active vendor cycles. Filterable by
 * vendor and by bearing (tailwind / headwind / neutral). Each item is
 * paper-prototype illustrative.
 */

import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Filter, Wind } from 'lucide-react'
import { PageHeader, Card, Badge, Button } from '@/components/ui'
import { FEED, VENDORS, type FeedItem } from '@/lib/demo/supportingData'
import { cn, formatRelative, type Tone } from '@/lib/utils'

const BEARING_LABEL = { tailwind: 'Tailwind', headwind: 'Headwind', neutral: 'Neutral' } as const
const BEARING_TONE: Record<FeedItem['bearing'], Tone> = {
  tailwind: 'success',
  headwind: 'critical',
  neutral: 'monitor',
}

export default function NewsSignals() {
  const [vendor, setVendor] = useState<string | 'all'>('all')
  const [bearing, setBearing] = useState<FeedItem['bearing'] | 'all'>('all')

  const filtered = useMemo(() => {
    return FEED.filter(f =>
      (vendor === 'all' || f.vendor === vendor) &&
      (bearing === 'all' || f.bearing === bearing),
    ).sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
  }, [vendor, bearing])

  const tailwinds = FEED.filter(f => f.bearing === 'tailwind').length
  const headwinds = FEED.filter(f => f.bearing === 'headwind').length

  return (
    <div className="px-10 py-8 max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="What the AI is watching"
        title="News & Signals"
        description="Vendor-tagged feed across all active Q1 2026 cycles. Bearings indicate whether a signal strengthens or weakens our position."
        meta={
          <>
            <span className="inline-flex items-center gap-1.5"><Wind className="w-3 h-3 text-success" />{tailwinds} tailwinds</span>
            <span className="text-tdds-300">·</span>
            <span className="inline-flex items-center gap-1.5"><Wind className="w-3 h-3 text-critical rotate-180" />{headwinds} headwinds</span>
          </>
        }
        actions={<Button variant="secondary" size="md" icon={Filter}>Customize feed</Button>}
      />

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="inline-flex items-center gap-1.5">
          <span className="eyebrow">Vendor</span>
          <FilterChip active={vendor === 'all'} onClick={() => setVendor('all')}>All</FilterChip>
          {VENDORS.map(v => (
            <FilterChip key={v.id} active={vendor === v.name} onClick={() => setVendor(v.name)}>{v.name}</FilterChip>
          ))}
        </div>
        <div className="inline-flex items-center gap-1.5">
          <span className="eyebrow">Bearing</span>
          <FilterChip active={bearing === 'all'} onClick={() => setBearing('all')}>All</FilterChip>
          <FilterChip active={bearing === 'tailwind'} onClick={() => setBearing('tailwind')} tone="success">Tailwind</FilterChip>
          <FilterChip active={bearing === 'headwind'} onClick={() => setBearing('headwind')} tone="critical">Headwind</FilterChip>
        </div>
      </div>

      {/* Feed */}
      <Card>
        <ul className="divide-y divide-tdds-100">
          {filtered.map(item => {
            const vd = VENDORS.find(v => v.name === item.vendor)
            return (
              <li key={item.id} className="px-5 py-4 flex gap-4 hover:bg-tdds-50/60 transition-colors group cursor-pointer">
                {/* Vendor mark */}
                <div className={cn(
                  'w-9 h-9 rounded-sm grid place-items-center font-display font-extrabold text-sm shrink-0',
                  vd ? 'bg-tdds-900 text-white' : 'bg-tdds-200 text-tdds-600',
                )}>
                  {vd?.logoMark ?? '·'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {item.vendor && (
                      <span className="text-[11px] font-semibold text-tdds-900">{item.vendor}</span>
                    )}
                    <span className="text-tdds-300">·</span>
                    <span className="text-[11px] text-tdds-500">{item.source}</span>
                    <span className="text-tdds-300">·</span>
                    <span className="text-[11px] text-tdds-500">{formatRelative(item.publishedAt)}</span>
                    <Badge tone={BEARING_TONE[item.bearing]} variant="dot" className="ml-1">{BEARING_LABEL[item.bearing]}</Badge>
                  </div>

                  <h3 className="text-[14px] font-semibold text-tdds-900 leading-snug">{item.headline}</h3>
                  {item.summary && (
                    <p className="text-[12px] text-tdds-600 mt-1 leading-relaxed">{item.summary}</p>
                  )}
                </div>

                <ExternalLink className="w-4 h-4 text-tdds-300 shrink-0 group-hover:text-tdds-700 mt-1 transition-colors" strokeWidth={1.85} />
              </li>
            )
          })}
        </ul>
      </Card>

      <p className="mt-6 text-[11px] text-tdds-400 leading-relaxed max-w-2xl">
        Feed is illustrative. In production, signals route through Claude Search + curated source list filtered to active vendors.
        Headlines for Pixel 10 cycle drive directly into the
        <Link to="/negotiations/pixel-10-q1-2026" className="text-magenta-600 hover:underline ml-1">Deal Room lever hypotheses</Link>.
      </p>
    </div>
  )
}

function FilterChip({ children, active, onClick, tone }: { children: React.ReactNode; active: boolean; onClick: () => void; tone?: 'success' | 'critical' }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 text-[11px] font-semibold rounded-sm ring-1 ring-inset transition-colors',
        active
          ? tone === 'success' ? 'bg-success text-white ring-success'
            : tone === 'critical' ? 'bg-critical text-white ring-critical'
            : 'bg-tdds-900 text-white ring-tdds-900'
          : 'text-tdds-600 ring-tdds-200 hover:ring-tdds-400 hover:text-tdds-900 bg-white',
      )}
    >
      {children}
    </button>
  )
}
