/**
 * Pixel 10 · Q1 2026 — negotiation record powering the Deal Room.
 *
 * Components feed the P&L waterfall; levers feed the slider cards;
 * signals feed the per-vendor news rail.
 */

export type WaterfallComponent = {
  id: string
  label: string
  /** Baseline value in $M. Negative = cost, positive = revenue/credit. */
  baseline: number
  /** After-negotiation value in $M. Same sign as baseline. */
  proposed: number
  kind: 'cost' | 'credit' | 'revenue'
  /** Lever id that controls this component (if interactive). */
  leverId?: string
}

export type Lever = {
  id: string
  name: string
  /** One-line summary of the value hypothesis (testable claim). */
  hypothesis: string
  /** Where the claim came from (sell-through data, internal analysis, etc.). */
  source: string
  /** Confidence in the claim. */
  confidence: 'high' | 'medium' | 'low'
  /** Optional caveat (e.g. "pending Ahmed Gupta validation"). */
  caveat?: string
  /** Component id this lever moves. */
  componentId: string
  /** Slider bounds. */
  min: number
  max: number
  step: number
  /** Direction this lever should move the *value* to improve CM. */
  improveBy: 'increase' | 'decrease'
}

export type VendorSignal = {
  id: string
  source: string
  publishedAt: string
  headline: string
  tone: 'critical' | 'high' | 'medium' | 'low'
  bearing: 'tailwind' | 'headwind' | 'neutral'
}

export type Negotiation = {
  id: string
  vendor: { name: string; logoMark: string }
  device: string
  cycle: string
  status: 'proposal_received' | 'in_analysis' | 'counter_drafted' | 'in_negotiation' | 'closed_won' | 'closed_lost'
  daysToClose: number
  /** Baseline CM if T-Mobile accepts vendor proposal as-is. */
  baselineCmM: number
  /** Counter-offer CM if all proposed lever moves are accepted. */
  proposedCmM: number
  /** Internal target CM. */
  targetCmM: number
  /** Unit volume in millions. */
  unitsM: number
  /** When negotiator last touched this deal. */
  lastTouchedAt: string
  components: WaterfallComponent[]
  levers: Lever[]
  signals: VendorSignal[]
}

// ────────────────────────────────────────────────────────────────
// Pixel 10 — Q1 2026 cycle
// ────────────────────────────────────────────────────────────────

export const PIXEL_10: Negotiation = {
  id: 'pixel-10-q1-2026',
  vendor: { name: 'Google', logoMark: 'G' },
  device: 'Pixel 10 — all color variants',
  cycle: 'Q1 2026',
  status: 'in_analysis',
  daysToClose: 12,
  baselineCmM: 10.0,
  proposedCmM: 14.8,
  targetCmM: 15.0,
  unitsM: 0.95,
  lastTouchedAt: '2026-05-15T13:42:00Z',

  // P&L waterfall components
  components: [
    { id: 'buy_cost',      label: 'Buying Cost',         baseline: -22.5, proposed: -21.3, kind: 'cost',    leverId: 'price_compression' },
    { id: 'volume_inc',    label: 'Volume Incentive',    baseline:   2.5, proposed:   3.5, kind: 'credit',  leverId: 'volume_incentive' },
    { id: 'mdf',           label: 'MDF',                 baseline:   1.5, proposed:   2.1, kind: 'credit',  leverId: 'mdf_expansion' },
    { id: 'revenue',       label: 'Revenue',             baseline:  29.0, proposed:  29.0, kind: 'revenue' },
    { id: 'reclamation',   label: 'Reclamation',         baseline:   1.5, proposed:   1.9, kind: 'credit',  leverId: 'reclamation' },
    { id: 'promos',        label: 'Promos & Discounts',  baseline:  -4.0, proposed:  -2.8, kind: 'cost',    leverId: 'promo_optimization' },
    { id: 'promo_support', label: 'Promo Support',       baseline:   2.0, proposed:   2.4, kind: 'credit',  leverId: 'promo_support' },
  ],

  // Levers — each is a testable hypothesis on the cycle
  levers: [
    {
      id: 'price_compression',
      name: 'Pricing',
      hypothesis: 'Vendor targets are set 8–12% below achievable. Pixel 9 sell-through patterns suggest ~5% real compression remains available without breaking the relationship.',
      source: 'Sell-through curve · Pixel 9 prior cycle',
      confidence: 'high',
      componentId: 'buy_cost',
      min: -22.5, max: -19.5, step: 0.1,
      improveBy: 'increase', // less negative = better
    },
    {
      id: 'volume_incentive',
      name: 'Volume Incentive Tier',
      hypothesis: 'Volume incentive thresholds are typically set 8–12% below achievable targets. Lifting the tier captures ~$1.0M.',
      source: 'Q1 planning analysis',
      confidence: 'high',
      componentId: 'volume_inc',
      min: 2.5, max: 4.5, step: 0.1,
      improveBy: 'increase',
    },
    {
      id: 'mdf_expansion',
      name: 'MDF Expansion',
      hypothesis: 'Market Development Funds underused by ~$0.6M last cycle. Reframe joint marketing for AI-camera launch to expand the pool.',
      source: 'Q1 planning analysis',
      confidence: 'medium',
      componentId: 'mdf',
      min: 1.5, max: 2.6, step: 0.1,
      improveBy: 'increase',
    },
    {
      id: 'promo_optimization',
      name: 'Promo Optimization',
      hypothesis: '~30% of promotional spend is non-productive — concentrated on duplicate channel mixes and tail SKUs.',
      source: 'Working hypothesis · channel review',
      confidence: 'medium',
      caveat: 'Pending external validation',
      componentId: 'promos',
      min: -4.0, max: -2.0, step: 0.1,
      improveBy: 'increase', // less negative = better
    },
    {
      id: 'reclamation',
      name: 'Reclamation Capture',
      hypothesis: 'Sell-through curve on Pixel 8 → 9 shows ~3% better unsold-unit reclamation captureable via earlier reverse-logistics triggers.',
      source: 'Sell-through analysis · 2024–2025 cycles',
      confidence: 'high',
      componentId: 'reclamation',
      min: 1.5, max: 2.2, step: 0.1,
      improveBy: 'increase',
    },
    {
      id: 'promo_support',
      name: 'Manufacturer Promo Support',
      hypothesis: 'Manufacturer co-funding underutilized — Q3 2025 cycle showed 18% co-fund headroom on launch promotions.',
      source: 'Vendor co-fund history · Q3 2025',
      confidence: 'medium',
      componentId: 'promo_support',
      min: 2.0, max: 2.8, step: 0.1,
      improveBy: 'increase',
    },
  ],

  // Vendor signals on Google
  signals: [
    {
      id: 's1',
      source: 'Bloomberg',
      publishedAt: '2026-05-14T16:20:00Z',
      headline: 'Google Pixel 10 Tensor G5 yields reportedly trailing internal targets — TSMC capacity flat for Q1',
      tone: 'high',
      bearing: 'tailwind',
    },
    {
      id: 's2',
      source: 'The Information',
      publishedAt: '2026-05-12T09:05:00Z',
      headline: 'Verizon-Google co-fund expanded to include AI Camera Studio launch — sets precedent for carrier MDF',
      tone: 'high',
      bearing: 'tailwind',
    },
    {
      id: 's3',
      source: 'Reuters',
      publishedAt: '2026-05-10T11:50:00Z',
      headline: 'Pixel 9 Q4 sell-through in NA softened 6% vs. internal forecast; carriers reportedly seeking concessions',
      tone: 'medium',
      bearing: 'tailwind',
    },
    {
      id: 's4',
      source: 'Counterpoint',
      publishedAt: '2026-05-08T08:00:00Z',
      headline: 'Samsung S25 launch slated for Mar 2026 — analyst notes flag potential cross-pull on premium tier',
      tone: 'medium',
      bearing: 'headwind',
    },
  ],
}

// Other active negotiations — for the home dashboard
export const NEGOTIATIONS_INDEX: Array<Pick<Negotiation, 'id' | 'vendor' | 'device' | 'cycle' | 'status' | 'daysToClose' | 'baselineCmM' | 'proposedCmM' | 'targetCmM' | 'unitsM' | 'lastTouchedAt'>> = [
  {
    id: 'pixel-10-q1-2026',
    vendor: { name: 'Google', logoMark: 'G' },
    device: 'Pixel 10',
    cycle: 'Q1 2026',
    status: 'in_analysis',
    daysToClose: 12,
    baselineCmM: 10.0,
    proposedCmM: 14.8,
    targetCmM: 15.0,
    unitsM: 0.95,
    lastTouchedAt: '2026-05-15T13:42:00Z',
  },
  {
    id: 'galaxy-s25-q1-2026',
    vendor: { name: 'Samsung', logoMark: 'S' },
    device: 'Galaxy S25 / S25+',
    cycle: 'Q1 2026',
    status: 'proposal_received',
    daysToClose: 28,
    baselineCmM: 22.0,
    proposedCmM: 22.0,
    targetCmM: 27.0,
    unitsM: 1.8,
    lastTouchedAt: '2026-05-14T17:10:00Z',
  },
  {
    id: 'edge-50-q1-2026',
    vendor: { name: 'Motorola', logoMark: 'M' },
    device: 'Edge 50 Ultra',
    cycle: 'Q1 2026',
    status: 'counter_drafted',
    daysToClose: 6,
    baselineCmM: 4.5,
    proposedCmM: 6.2,
    targetCmM: 6.5,
    unitsM: 0.3,
    lastTouchedAt: '2026-05-15T09:18:00Z',
  },
  {
    id: 'htc-u25-q1-2026',
    vendor: { name: 'HTC', logoMark: 'H' },
    device: 'U25 Pro',
    cycle: 'Q1 2026',
    status: 'in_negotiation',
    daysToClose: 3,
    baselineCmM: 1.8,
    proposedCmM: 2.4,
    targetCmM: 2.5,
    unitsM: 0.12,
    lastTouchedAt: '2026-05-15T12:00:00Z',
  },
  {
    id: 'apple-iphone-17-q1-2026',
    vendor: { name: 'Apple', logoMark: 'A' },
    device: 'iPhone 17 line',
    cycle: 'Q1 2026',
    status: 'in_negotiation',
    daysToClose: 19,
    baselineCmM: 38.0,
    proposedCmM: 38.0,
    targetCmM: 38.0,
    unitsM: 4.2,
    lastTouchedAt: '2026-05-13T15:55:00Z',
  },
]

export const STATUS_LABEL: Record<Negotiation['status'], string> = {
  proposal_received: 'Proposal received',
  in_analysis: 'In analysis',
  counter_drafted: 'Counter drafted',
  in_negotiation: 'In negotiation',
  closed_won: 'Closed — won',
  closed_lost: 'Closed — lost',
}
