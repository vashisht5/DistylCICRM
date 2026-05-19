/**
 * Vendors, news feed, and stakeholder records used across the app
 * outside the Deal Room workspace.
 */

import { PIXEL_10 } from './pixel10'

// ─── Vendors ────────────────────────────────────────────────

export type VendorProfile = {
  id: string
  name: string
  logoMark: string
  category: 'core' | 'flagship' | 'tier-two'
  hq: string
  annualSpendBnUsd: number
  activeNegotiations: number
  exposureTone: 'critical' | 'high' | 'medium' | 'low'
  posture: string
  riskNotes: string
  recentMoves: number
}

export const VENDORS: VendorProfile[] = [
  {
    id: 'google',
    name: 'Google',
    logoMark: 'G',
    category: 'flagship',
    hq: 'Mountain View, CA',
    annualSpendBnUsd: 0.9,
    activeNegotiations: 1,
    exposureTone: 'high',
    posture: 'Aggressive on volume tiers; cooperative on MDF.',
    riskNotes: 'Tensor G5 yield risk — capacity could tighten Q1.',
    recentMoves: 4,
  },
  {
    id: 'samsung',
    name: 'Samsung',
    logoMark: 'S',
    category: 'core',
    hq: 'Suwon, KR',
    annualSpendBnUsd: 2.1,
    activeNegotiations: 1,
    exposureTone: 'critical',
    posture: 'Cycle-over-cycle volume push. Promo support flexible.',
    riskNotes: 'S25 launch cross-pull on premium tier vs Pixel 10.',
    recentMoves: 6,
  },
  {
    id: 'apple',
    name: 'Apple',
    logoMark: 'A',
    category: 'flagship',
    hq: 'Cupertino, CA',
    annualSpendBnUsd: 7.4,
    activeNegotiations: 1,
    exposureTone: 'critical',
    posture: 'Non-negotiable on wholesale price. MDF parity only.',
    riskNotes: 'iPhone 17 cycle dominates premium quarter.',
    recentMoves: 2,
  },
  {
    id: 'motorola',
    name: 'Motorola',
    logoMark: 'M',
    category: 'tier-two',
    hq: 'Chicago, IL',
    annualSpendBnUsd: 0.18,
    activeNegotiations: 1,
    exposureTone: 'medium',
    posture: 'Eager on volume; concedes on promo support.',
    riskNotes: 'Lenovo parent strategy shift could affect MDF.',
    recentMoves: 3,
  },
  {
    id: 'htc',
    name: 'HTC',
    logoMark: 'H',
    category: 'tier-two',
    hq: 'New Taipei, TW',
    annualSpendBnUsd: 0.04,
    activeNegotiations: 1,
    exposureTone: 'low',
    posture: 'Margin-constrained; pursuing strategic distribution.',
    riskNotes: 'Smallest volume — least leverage but highest flexibility.',
    recentMoves: 1,
  },
]

// ─── News / signals — vendor-tagged feed ──────────────────────

export type FeedItem = {
  id: string
  vendor?: string
  source: string
  publishedAt: string
  headline: string
  summary: string
  tone: 'critical' | 'high' | 'medium' | 'low'
  bearing: 'tailwind' | 'headwind' | 'neutral'
  category: 'pricing' | 'supply' | 'demand' | 'corporate' | 'competitive'
}

export const FEED: FeedItem[] = [
  ...PIXEL_10.signals.map<FeedItem>(s => ({
    id: s.id,
    vendor: 'Google',
    source: s.source,
    publishedAt: s.publishedAt,
    headline: s.headline,
    summary: '',
    tone: s.tone,
    bearing: s.bearing,
    category: 'supply',
  })),
  {
    id: 'f1',
    vendor: 'Samsung',
    source: 'Reuters',
    publishedAt: '2026-05-15T08:15:00Z',
    headline: 'Samsung S25 sell-through pre-orders 18% above S24 trajectory in NA',
    summary: 'Strong pre-order velocity for premium tier may strengthen Samsung\'s position in Q1 carrier negotiations.',
    tone: 'high',
    bearing: 'headwind',
    category: 'demand',
  },
  {
    id: 'f2',
    vendor: 'Apple',
    source: 'WSJ',
    publishedAt: '2026-05-14T11:30:00Z',
    headline: 'Apple holds line on iPhone 17 wholesale pricing — no carrier concessions in Q1',
    summary: 'Apple\'s annual posture confirmed in earnings call. Carriers reportedly seeking parity with Samsung promo support; rebuffed.',
    tone: 'medium',
    bearing: 'headwind',
    category: 'pricing',
  },
  {
    id: 'f3',
    vendor: 'Motorola',
    source: 'CRN',
    publishedAt: '2026-05-13T15:50:00Z',
    headline: 'Lenovo restructures mobile business unit — Motorola gains commercial autonomy on US carrier deals',
    summary: 'Edge 50 Ultra promo support thresholds may expand following restructure. Expect Motorola flexibility to increase.',
    tone: 'medium',
    bearing: 'tailwind',
    category: 'corporate',
  },
  {
    id: 'f4',
    vendor: 'Google',
    source: 'Industry Analyst Note',
    publishedAt: '2026-05-12T07:00:00Z',
    headline: 'Promo waste in NA Pixel channel estimated at 28–32% of total spend',
    summary: 'Validates the working hypothesis that promo optimization is a $1.2M+ lever. Aligns with Pixel-side Q4 internal review.',
    tone: 'high',
    bearing: 'tailwind',
    category: 'pricing',
  },
  {
    id: 'f5',
    vendor: 'Samsung',
    source: 'Counterpoint',
    publishedAt: '2026-05-11T12:00:00Z',
    headline: 'Samsung MDF spend in NA cut 12% YoY — competitive opening for carriers',
    summary: 'Reduced upstream marketing budget could shift to direct carrier MDF. Worth probing in Galaxy S25 cycle.',
    tone: 'medium',
    bearing: 'tailwind',
    category: 'corporate',
  },
  {
    id: 'f6',
    vendor: 'HTC',
    source: 'Industry Week',
    publishedAt: '2026-05-09T10:00:00Z',
    headline: 'HTC U25 Pro launch slips two weeks — Q1 availability now constrained',
    summary: 'Supply tightening favors carrier leverage on volume commitment vs price.',
    tone: 'low',
    bearing: 'tailwind',
    category: 'supply',
  },
]

// ─── Stakeholders — T-Mobile internal + vendor counterparts ──

export type Stakeholder = {
  id: string
  name: string
  title: string
  side: 'internal' | 'vendor' | 'partner'
  org: string
  influence: 'high' | 'medium' | 'low'
  notes: string
  tags: string[]
}

export const STAKEHOLDERS: Stakeholder[] = [
  {
    id: 'cpo',
    name: 'Mike Simpson',
    title: 'Chief Procurement Officer · Devices & Hardware',
    side: 'internal',
    org: 'T-Mobile',
    influence: 'high',
    notes: 'Approves counter-offers above $5M variance. Prefers dollar-impact framing over technical narrative. Walks into the Google meeting himself.',
    tags: ['approver', 'q1-cycle', 'lead-negotiator'],
  },
  {
    id: 'sourcing-lead',
    name: 'Priya Raman',
    title: 'Director, Strategic Sourcing — Smartphones',
    side: 'internal',
    org: 'T-Mobile',
    influence: 'high',
    notes: 'Owns the Pixel relationship end-to-end. Drafts counter-offers; runs the working sessions with Google\'s commercial team.',
    tags: ['deal-owner', 'pixel-10'],
  },
  {
    id: 'category-mgr',
    name: 'Marcus Lee',
    title: 'Senior Category Manager · Android Flagships',
    side: 'internal',
    org: 'T-Mobile',
    influence: 'medium',
    notes: 'Cross-vendor view across Pixel, Galaxy, Motorola. Calls re-allocation trade-offs if Google walks below floor.',
    tags: ['category', 'cross-vendor'],
  },
  {
    id: 'finance-bp',
    name: 'Dana Whitfield',
    title: 'Finance Business Partner · Devices',
    side: 'internal',
    org: 'T-Mobile',
    influence: 'medium',
    notes: 'Owns the CM model and target-setting. Signs off on MDF and reclamation accounting before any commitment goes out.',
    tags: ['finance', 'cm-model'],
  },
  {
    id: 'contract-counsel',
    name: 'Janet Okafor',
    title: 'Senior Counsel · Commercial Contracts',
    side: 'internal',
    org: 'T-Mobile',
    influence: 'medium',
    notes: 'Reviews exclusivity, volume-tier, and MDF language. Flags risk on multi-cycle commitments.',
    tags: ['legal', 'contracts'],
  },
  {
    id: 'demand-planner',
    name: 'Carlos Mendez',
    title: 'Lead Demand Planner · Premium Tier',
    side: 'internal',
    org: 'T-Mobile',
    influence: 'medium',
    notes: 'Maintains volume forecast and EIP roll-off curve. Source of truth on the 312K Pixel devices coming off EIP this quarter.',
    tags: ['forecasting', 'eip'],
  },
  {
    id: 'tara',
    name: 'Tara Sundaresan',
    title: 'Global Carrier Partnerships Lead, Pixel',
    side: 'vendor',
    org: 'Google',
    influence: 'high',
    notes: '6 yrs tenure. Medium risk tolerance. Defers to Pixel GM on >$2M concessions. Over-prepares.',
    tags: ['negotiation-counterpart', 'pixel-10'],
  },
  {
    id: 'samsung-rep',
    name: 'Hyo-jin Park',
    title: 'VP, North America Carrier Sales',
    side: 'vendor',
    org: 'Samsung',
    influence: 'high',
    notes: 'Aggressive on volume tiers. Has authority for MDF up to $2.5M without escalation.',
    tags: ['negotiation-counterpart', 's25'],
  },
  {
    id: 'apple-rep',
    name: 'Daniel Hong',
    title: 'Sr Director, Carrier Strategy',
    side: 'vendor',
    org: 'Apple',
    influence: 'high',
    notes: 'Holds line on wholesale price. No authority to concede; channel sets margin.',
    tags: ['negotiation-counterpart', 'iphone-17'],
  },
]
