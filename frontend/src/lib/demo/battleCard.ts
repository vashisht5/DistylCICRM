/**
 * Battle Card data — Pixel 10 negotiation counterpart.
 *
 * Single-page brief Mike Simpson takes into the in-person meeting with
 * Google. Vendor profile, counterpart bio, recent moves, and explicit
 * "open with / fallback / walk-away" positions per lever.
 */

export type CounterpartBio = {
  name: string
  title: string
  tenureYrs: number
  riskTolerance: 'low' | 'medium' | 'high'
  decisionStyle: string
  knownPriorities: string[]
  knownConcessions: string[]
}

export type VendorContext = {
  recentMove: string
  ourLeverage: string
  theirLeverage: string
}

export type LeverPosition = {
  leverId: string
  open: string       // opening ask
  target: string     // expected landing
  walkAway: string   // floor
  rationale: string  // 1-sentence why
}

export type BattleCard = {
  dealId: string
  vendor: { name: string; logoMark: string }
  device: string
  cycle: string
  meetingContext: string
  ourGoalCm: number
  counterpart: CounterpartBio
  context: VendorContext[]
  leverPositions: LeverPosition[]
  openersAndCloses: { openers: string[]; closers: string[]; redLines: string[] }
}

export const PIXEL_10_BATTLE_CARD: BattleCard = {
  dealId: 'pixel-10-q1-2026',
  vendor: { name: 'Google', logoMark: 'G' },
  device: 'Pixel 10 — Q1 2026 cycle',
  cycle: 'Q1 2026',
  meetingContext: 'In-person at T-Mobile HQ Bellevue · 90 min · CPO + Procurement Lead from each side · No legal in room',
  ourGoalCm: 15.0,

  counterpart: {
    name: 'Tara Sundaresan',
    title: 'Global Carrier Partnerships Lead, Pixel',
    tenureYrs: 6,
    riskTolerance: 'medium',
    decisionStyle: 'Data-led but defers to Pixel General Manager on >$2M concessions. Reads tone fast; over-prepares.',
    knownPriorities: [
      'Pixel 10 sell-through volume — internal Google OKR is ≥1M units in NA Q1',
      'AI Camera Studio launch co-marketing footprint',
      'Reducing carrier promo waste (Q4 internal review flagged 22% inefficient spend)',
    ],
    knownConcessions: [
      'Has gone +$1.2M on MDF for Verizon AI Camera launch (Apr 2026)',
      'Approved Pixel 9 promo support uplift of +18% for Q3 2025',
      'Walked away on volume-tier renegotiation with EE (UK) in Jan 2026 — willing to lose deals',
    ],
  },

  context: [
    {
      recentMove: 'Pixel 9 NA sell-through softened 6% vs forecast (Reuters · May 10).',
      ourLeverage: 'Carriers seeking concessions; we are the largest US prepaid distributor — they need our placement.',
      theirLeverage: 'They will argue Q1 Pixel 10 has fresh demand and Q4 softness is historical.',
    },
    {
      recentMove: 'Tensor G5 yields trailing internal targets — TSMC capacity flat (Bloomberg · May 14).',
      ourLeverage: 'Yields constraint = fewer competing carrier asks. Volume becomes premium.',
      theirLeverage: 'They could allocate to a lower-margin competitor for higher headline volume.',
    },
    {
      recentMove: 'Verizon AI Camera co-fund expanded (The Information · May 12).',
      ourLeverage: 'Precedent for carrier MDF expansion is set — we ask for parity.',
      theirLeverage: 'They will claim Verizon spend was for exclusive 6-month window we don\'t want.',
    },
  ],

  leverPositions: [
    {
      leverId: 'price_compression',
      open: 'Ask for 6% list compression off Pixel 10 wholesale',
      target: '5% — matches Pixel 9 sell-through-implied price elasticity',
      walkAway: '3% — anything below and we re-allocate the bay to Samsung S25',
      rationale: 'Pixel 9 sell-through shows clear 5% price ceiling; we have the data.',
    },
    {
      leverId: 'volume_incentive',
      open: 'Push volume tier threshold from 850K → 900K units with +$1.5M payout',
      target: '+$1.0M (per Q1 analysis)',
      walkAway: '+$0.6M and tier holds at 850K',
      rationale: 'Their internal NA volume OKR is ≥1M — they need us at the high tier.',
    },
    {
      leverId: 'mdf_expansion',
      open: 'Match Verizon AI Camera Studio precedent — +$0.8M MDF',
      target: '+$0.6M to fully utilize underspend',
      walkAway: 'Hold MDF at $1.5M — accept current pool',
      rationale: 'Verizon precedent is public. Their refusal would read inconsistent to Tara\'s GM.',
    },
    {
      leverId: 'promo_optimization',
      open: 'Cut $1.5M of low-yield promo channels (test SKUs, tail color variants)',
      target: '$1.2M (~30% of promo identified as non-productive)',
      walkAway: '$0.8M — preserve high-yield Black Friday support',
      rationale: 'Q4 internal Google review already flagged 22% inefficient promo. They agree the problem exists.',
    },
    {
      leverId: 'reclamation',
      open: 'Earlier reclamation triggers — 90 days post-launch instead of 120',
      target: '+$0.4M from 3% better unsold capture',
      walkAway: 'Hold 120-day window',
      rationale: 'Sell-through curve data on Pixel 8→9 is decisive; pure logistics ask, low political cost for them.',
    },
    {
      leverId: 'promo_support',
      open: 'Manufacturer co-fund on launch promo at 70% (vs current 52%)',
      target: '60% (~+$0.4M)',
      walkAway: '55%',
      rationale: 'Q3 2025 cycle showed 18% headroom — quantified, hard to argue.',
    },
  ],

  openersAndCloses: {
    openers: [
      '"We\'ve modeled the Pixel 10 cycle six different ways. The version where we both walk in happy lands at $15M contribution margin — $5M above where the proposal sits today. Let me show you the levers."',
      '"You and I have done this five cycles. Let\'s skip the dance — here are the four moves that get us both to a yes."',
      '"Q1 is your volume OKR. Q1 is our margin number. The math says they don\'t conflict if we adjust three things."',
    ],
    closers: [
      '"If we land at $14M+ I\'ll walk this up to our exec team this week. Below that, we have to look at Samsung\'s S25 bay allocation."',
      '"Let\'s put it in writing this week — I\'d like to skip the standard 3 weeks of back-and-forth."',
    ],
    redLines: [
      'Do not concede price compression below 3%. Bay re-allocation to Samsung is real and viable.',
      'Do not accept MDF cuts. Even flat is acceptable; cuts are not.',
      'Do not lock in 18-month exclusivity asks — Apple cycle pressure makes any exclusive risky.',
    ],
  },
}
