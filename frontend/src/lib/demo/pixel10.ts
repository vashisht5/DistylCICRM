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
  /** Current agent recommendation — recomputed as new signals land. */
  agentRecommendation: number
}

/** A single snapshot of agent recommendations across all levers, tied to a triggering signal. */
export type AgentSnapshot = {
  id: string
  at: string
  label: string
  trigger: string
  /** Position per lever id. */
  positions: Record<string, number>
}

/** RFP — a tendered category that multiple vendors bid against. */
export type Rfp = {
  id: string
  /** Short code shown in chips/dropdown. */
  code: string
  /** Display name. */
  name: string
  /** Price band the tender covers. */
  priceBand: string
  /** Quarter / cycle. */
  cycle: string
  /** When the RFP closes to bids. */
  closesOn: string
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
  /** RFP this tender belongs to. */
  rfpId: string
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
  rfpId: 'rfp-premium-q1-2026',
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
      agentRecommendation: -21.3,
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
      agentRecommendation: 3.5,
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
      agentRecommendation: 2.1,
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
      agentRecommendation: -2.8,
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
      agentRecommendation: 1.9,
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
      agentRecommendation: 2.4,
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

// ────────────────────────────────────────────────────────────────
// RFPs — what we tender against. Vendors bid into a band, not a SKU.
// ────────────────────────────────────────────────────────────────

export const RFPS: Rfp[] = [
  {
    id: 'rfp-flagship-q1-2026',
    code: 'RFP-26Q1-FLAG',
    name: 'Flagship handsets',
    priceBand: '$1,000+',
    cycle: 'Q1 2026',
    closesOn: '2026-06-20',
  },
  {
    id: 'rfp-premium-q1-2026',
    code: 'RFP-26Q1-PREM',
    name: 'Premium handsets',
    priceBand: '$750–999',
    cycle: 'Q1 2026',
    closesOn: '2026-06-06',
  },
  {
    id: 'rfp-midtier-q1-2026',
    code: 'RFP-26Q1-MID',
    name: 'Mid-tier handsets',
    priceBand: '$400–749',
    cycle: 'Q1 2026',
    closesOn: '2026-06-02',
  },
  {
    id: 'rfp-entry-q1-2026',
    code: 'RFP-26Q1-ENTRY',
    name: 'Entry handsets',
    priceBand: '$199–399',
    cycle: 'Q1 2026',
    closesOn: '2026-05-29',
  },
]

// Other active negotiations — for the home dashboard
export const NEGOTIATIONS_INDEX: Array<Pick<Negotiation, 'id' | 'rfpId' | 'vendor' | 'device' | 'cycle' | 'status' | 'daysToClose' | 'baselineCmM' | 'proposedCmM' | 'targetCmM' | 'unitsM' | 'lastTouchedAt'>> = [
  // ─── Flagship ($1,000+) ───
  {
    id: 'iphone-17-pro-max-q1-2026',
    rfpId: 'rfp-flagship-q1-2026',
    vendor: { name: 'Apple', logoMark: 'A' },
    device: 'iPhone 17 Pro / Pro Max',
    cycle: 'Q1 2026',
    status: 'in_negotiation',
    daysToClose: 19,
    baselineCmM: 38.0,
    proposedCmM: 38.0,
    targetCmM: 38.0,
    unitsM: 4.2,
    lastTouchedAt: '2026-05-13T15:55:00Z',
  },
  {
    id: 'galaxy-z-fold-q1-2026',
    rfpId: 'rfp-flagship-q1-2026',
    vendor: { name: 'Samsung', logoMark: 'S' },
    device: 'Galaxy Z Fold 7',
    cycle: 'Q1 2026',
    status: 'proposal_received',
    daysToClose: 24,
    baselineCmM: 6.8,
    proposedCmM: 6.8,
    targetCmM: 8.5,
    unitsM: 0.18,
    lastTouchedAt: '2026-05-14T11:30:00Z',
  },
  {
    id: 'pixel-10-pro-fold-q1-2026',
    rfpId: 'rfp-flagship-q1-2026',
    vendor: { name: 'Google', logoMark: 'G' },
    device: 'Pixel 10 Pro Fold',
    cycle: 'Q1 2026',
    status: 'in_analysis',
    daysToClose: 16,
    baselineCmM: 2.4,
    proposedCmM: 2.9,
    targetCmM: 3.2,
    unitsM: 0.06,
    lastTouchedAt: '2026-05-15T08:45:00Z',
  },

  // ─── Premium ($750–999) — the headline RFP ───
  {
    id: 'pixel-10-q1-2026',
    rfpId: 'rfp-premium-q1-2026',
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
    id: 'galaxy-s26-q1-2026',
    rfpId: 'rfp-premium-q1-2026',
    vendor: { name: 'Samsung', logoMark: 'S' },
    device: 'Galaxy S26 / S26+',
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
    id: 'oneplus-13-q1-2026',
    rfpId: 'rfp-premium-q1-2026',
    vendor: { name: 'OnePlus', logoMark: 'O' },
    device: 'OnePlus 13',
    cycle: 'Q1 2026',
    status: 'counter_drafted',
    daysToClose: 9,
    baselineCmM: 3.2,
    proposedCmM: 4.1,
    targetCmM: 4.4,
    unitsM: 0.22,
    lastTouchedAt: '2026-05-15T10:05:00Z',
  },

  // ─── Mid-tier ($400–749) ───
  {
    id: 'edge-50-q1-2026',
    rfpId: 'rfp-midtier-q1-2026',
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
    id: 'pixel-9a-q1-2026',
    rfpId: 'rfp-midtier-q1-2026',
    vendor: { name: 'Google', logoMark: 'G' },
    device: 'Pixel 9a refresh',
    cycle: 'Q1 2026',
    status: 'in_negotiation',
    daysToClose: 4,
    baselineCmM: 1.9,
    proposedCmM: 2.6,
    targetCmM: 2.8,
    unitsM: 0.14,
    lastTouchedAt: '2026-05-15T14:22:00Z',
  },
  {
    id: 'oppo-reno-q1-2026',
    rfpId: 'rfp-midtier-q1-2026',
    vendor: { name: 'OPPO', logoMark: 'O' },
    device: 'Reno 12 series',
    cycle: 'Q1 2026',
    status: 'proposal_received',
    daysToClose: 22,
    baselineCmM: 1.4,
    proposedCmM: 1.4,
    targetCmM: 2.0,
    unitsM: 0.11,
    lastTouchedAt: '2026-05-13T16:40:00Z',
  },

  // ─── Entry ($199–399) ───
  {
    id: 'htc-u25-q1-2026',
    rfpId: 'rfp-entry-q1-2026',
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
    id: 'tcl-50-xl-q1-2026',
    rfpId: 'rfp-entry-q1-2026',
    vendor: { name: 'TCL', logoMark: 'T' },
    device: 'TCL 50 XL 5G',
    cycle: 'Q1 2026',
    status: 'counter_drafted',
    daysToClose: 2,
    baselineCmM: 0.9,
    proposedCmM: 1.3,
    targetCmM: 1.4,
    unitsM: 0.08,
    lastTouchedAt: '2026-05-15T11:25:00Z',
  },
]

// ────────────────────────────────────────────────────────────────
// Agent recommendation history — the background optimizer's prior
// stances, each tied to a triggering signal. Index 0 = oldest.
// ────────────────────────────────────────────────────────────────

export const AGENT_SNAPSHOTS: AgentSnapshot[] = [
  {
    id: 'snap-rfp-launch',
    at: '2026-05-01T08:00:00Z',
    label: 'RFP launch',
    trigger: 'Initial position from Pixel 9 cycle parameters',
    positions: {
      buy_cost: -22.0,
      volume_inc: 2.8,
      mdf: 1.6,
      promos: -3.6,
      reclamation: 1.6,
      promo_support: 2.1,
    },
  },
  {
    id: 'snap-counterpoint-samsung',
    at: '2026-05-08T08:00:00Z',
    label: 'Samsung S26 launch dated',
    trigger: 'Counterpoint flags potential premium-tier cross-pull from Samsung S26',
    positions: {
      buy_cost: -21.9,
      volume_inc: 3.0,
      mdf: 1.7,
      promos: -3.4,
      reclamation: 1.7,
      promo_support: 2.2,
    },
  },
  {
    id: 'snap-reuters-pixel9-softening',
    at: '2026-05-10T11:50:00Z',
    label: 'Pixel 9 sell-through softens',
    trigger: 'Reuters: Pixel 9 Q4 NA sell-through 6pp below internal forecast',
    positions: {
      buy_cost: -21.6,
      volume_inc: 3.3,
      mdf: 1.8,
      promos: -3.1,
      reclamation: 1.8,
      promo_support: 2.3,
    },
  },
  {
    id: 'snap-verizon-google-cofund',
    at: '2026-05-12T09:05:00Z',
    label: 'Verizon-Google co-fund expands',
    trigger: 'Co-fund extended to AI Camera Studio — MDF pool precedent',
    positions: {
      buy_cost: -21.5,
      volume_inc: 3.4,
      mdf: 2.0,
      promos: -2.9,
      reclamation: 1.8,
      promo_support: 2.4,
    },
  },
  {
    id: 'snap-bloomberg-yields',
    at: '2026-05-14T16:20:00Z',
    label: 'Tensor G5 yields trail',
    trigger: 'Bloomberg: TSMC capacity flat, Tensor G5 yields under internal target',
    positions: {
      buy_cost: -21.3,
      volume_inc: 3.5,
      mdf: 2.1,
      promos: -2.8,
      reclamation: 1.9,
      promo_support: 2.4,
    },
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
