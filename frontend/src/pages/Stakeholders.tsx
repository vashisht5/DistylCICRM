/**
 * Stakeholders — everyone touching the device procurement engagement.
 *
 * Three buckets:
 *   - Internal (T-Mobile)
 *   - Partner (Bain)
 *   - Vendor (counterparts at Google, Samsung, Apple, etc.)
 */

import { Building2, Crown, Users } from 'lucide-react'
import { PageHeader, Card, Badge } from '@/components/ui'
import { STAKEHOLDERS, type Stakeholder } from '@/lib/demo/supportingData'
import { cn } from '@/lib/utils'

const SIDE_META = {
  internal: { label: 'T-Mobile', icon: Crown, color: 'text-magenta-600 bg-magenta-50 ring-magenta-200' },
  partner:  { label: 'Bain',     icon: Users, color: 'text-tdds-700 bg-tdds-100 ring-tdds-200' },
  vendor:   { label: 'Vendor',   icon: Building2, color: 'text-warning bg-warning/8 ring-warning/20' },
}

export default function Stakeholders() {
  const grouped: Record<Stakeholder['side'], Stakeholder[]> = {
    internal: STAKEHOLDERS.filter(s => s.side === 'internal'),
    partner:  STAKEHOLDERS.filter(s => s.side === 'partner'),
    vendor:   STAKEHOLDERS.filter(s => s.side === 'vendor'),
  }

  return (
    <div className="px-10 py-8 max-w-[1400px] mx-auto">
      <PageHeader
        eyebrow="Engagement org map"
        title="Stakeholders"
        description="Every person in the room — or behind it. Decision-makers, partners, counterparts. Tap a card to view battle-card-style depth (Phase G+)."
      />

      <div className="space-y-8">
        {(['internal', 'partner', 'vendor'] as const).map(side => {
          const items = grouped[side]
          if (items.length === 0) return null
          const meta = SIDE_META[side]
          const Icon = meta.icon
          return (
            <section key={side}>
              <div className="flex items-baseline justify-between mb-3">
                <div className="inline-flex items-center gap-2">
                  <Icon className="w-4 h-4 text-tdds-500" strokeWidth={1.85} />
                  <h2 className="font-display text-base font-bold text-tdds-900 tracking-tight">{meta.label}</h2>
                  <span className="text-[11px] text-tdds-400 font-semibold">· {items.length}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map(s => (
                  <Card key={s.id} className="p-5" interactive>
                    <div className="flex items-start gap-3 mb-3">
                      <div className={cn(
                        'w-10 h-10 rounded-full grid place-items-center font-display font-bold text-base shrink-0',
                        side === 'internal' ? 'bg-magenta-500 text-white' : 'bg-tdds-900 text-white',
                      )}>
                        {initials(s.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-display font-bold text-tdds-900 text-[14px] tracking-tight leading-tight">{s.name}</div>
                        <div className="text-[12px] text-tdds-600 mt-0.5 font-medium leading-tight">{s.title}</div>
                        <div className="text-[11px] text-tdds-400 mt-1">{s.org}</div>
                      </div>
                      <Badge
                        tone={s.influence === 'high' ? 'brand' : s.influence === 'medium' ? 'high' : 'monitor'}
                        variant="dot"
                        uppercase
                      >
                        {s.influence}
                      </Badge>
                    </div>
                    <p className="text-[12px] text-tdds-700 leading-relaxed">{s.notes}</p>
                    {s.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-3">
                        {s.tags.map(t => (
                          <span key={t} className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 bg-tdds-100 text-tdds-600 rounded-sm">
                            {t.replace(/-/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
}
