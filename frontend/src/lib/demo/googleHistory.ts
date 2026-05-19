/**
 * Google vendor historicals feeding the Vendor detail page —
 * three cycles of unit volume, pricing, MDF, and promo support.
 */

export type CycleHistory = {
  cycle: string                  // e.g. "Q1 2024"
  device: string                 // e.g. "Pixel 8"
  unitsK: number                 // units sold, thousands
  sellThroughPct: number         // % of units placed that actually moved
  wholesaleAvgUsd: number        // average per-unit wholesale price ($)
  listAvgUsd: number             // average per-unit list price ($)
  mdfM: number                   // MDF dollars released ($M)
  promoSupportM: number          // manufacturer co-fund on promo ($M)
  promoCofundPct: number         // % of promo spend Google co-funded
  cmM: number                    // realized contribution margin ($M)
}

export const GOOGLE_HISTORY: CycleHistory[] = [
  {
    cycle: 'Q1 2023',
    device: 'Pixel 7',
    unitsK: 720,
    sellThroughPct: 84,
    wholesaleAvgUsd: 612,
    listAvgUsd: 699,
    mdfM: 1.1,
    promoSupportM: 1.4,
    promoCofundPct: 48,
    cmM: 7.8,
  },
  {
    cycle: 'Q1 2024',
    device: 'Pixel 8',
    unitsK: 840,
    sellThroughPct: 88,
    wholesaleAvgUsd: 638,
    listAvgUsd: 729,
    mdfM: 1.3,
    promoSupportM: 1.7,
    promoCofundPct: 51,
    cmM: 8.6,
  },
  {
    cycle: 'Q1 2025',
    device: 'Pixel 9',
    unitsK: 905,
    sellThroughPct: 82,                  // softened — the signal flagged in news
    wholesaleAvgUsd: 651,
    listAvgUsd: 749,
    mdfM: 1.5,
    promoSupportM: 2.0,
    promoCofundPct: 52,
    cmM: 10.0,
  },
]

/**
 * EIP (Equipment Installment Plan) roll-off — Google devices coming off contract
 * this cycle. Each one represents a potential Pixel 10 upgrade.
 */
export type EipRollOff = {
  device: string
  unitsK: number          // thousands of devices coming off EIP
  avgAgeMonths: number    // average age at roll-off
  upgradeIntentPct: number  // % likely to upgrade to a new Pixel
}

export const GOOGLE_EIP_ROLLOFF: EipRollOff[] = [
  { device: 'Pixel 7',      unitsK: 142, avgAgeMonths: 36, upgradeIntentPct: 58 },
  { device: 'Pixel 7 Pro',  unitsK:  68, avgAgeMonths: 36, upgradeIntentPct: 64 },
  { device: 'Pixel 6a',     unitsK:  54, avgAgeMonths: 30, upgradeIntentPct: 42 },
  { device: 'Pixel 6',      unitsK:  31, avgAgeMonths: 42, upgradeIntentPct: 51 },
  { device: 'Pixel 5',      unitsK:  17, avgAgeMonths: 54, upgradeIntentPct: 46 },
]

/**
 * Last cycle's negotiation outcome — what we walked away with on Pixel 9.
 * Used to anchor the "what concessions did we get last time" view.
 */
export const PIXEL_9_NEGOTIATION_OUTCOME = {
  cycle: 'Q1 2025',
  device: 'Pixel 9',
  cycleDurationDays: 47,
  openingProposalCmM: 7.2,    // what Google initially offered
  signedCmM: 10.0,             // what we landed at
  upliftM: 2.8,
  upliftPct: 38.9,
  leverOutcomes: [
    { lever: 'Pricing',              ask: '5% list compression',     landed: '3.5% list compression',     valueM: 0.9 },
    { lever: 'Volume Incentive',     ask: '+$1.0M at 850K tier',     landed: '+$0.7M at 870K tier',        valueM: 0.7 },
    { lever: 'MDF Expansion',        ask: '+$0.6M MDF',              landed: '+$0.4M MDF',                 valueM: 0.4 },
    { lever: 'Reclamation',          ask: '90-day reclamation',      landed: '105-day reclamation',        valueM: 0.3 },
    { lever: 'Promo Optimization',   ask: '$1.2M cut',               landed: '$0.5M cut',                  valueM: 0.5 },
  ],
}

/**
 * Demand summary derived from history + EIP roll-off.
 */
export const GOOGLE_DEMAND_SYNTHESIS = {
  knownDemandUnitsK: 312,                // sum of EIP roll-off
  upgradeCaptureK: 184,                  // weighted by upgradeIntentPct
  trendUnitsCagrPct: 12.1,               // 3-cycle CAGR on unit volume
  trendPriceCagrPct: 3.2,                // 3-cycle CAGR on wholesale price
  promoEfficiencyDeltaPct: -8,           // sell-through softened despite higher promo
}
