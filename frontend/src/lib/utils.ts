import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ────────────────────────────────────────────────────────────
// Money formatting — every screen shows dollars. Be consistent.
// ────────────────────────────────────────────────────────────

export function formatMoney(value: number, opts: { compact?: boolean; sign?: boolean; decimals?: 0 | 1 | 2 } = {}): string {
  const { compact = true, sign = false, decimals = 1 } = opts
  const abs = Math.abs(value)
  let body: string
  if (compact) {
    if (abs >= 1_000_000_000) body = `$${(abs / 1_000_000_000).toFixed(decimals)}B`
    else if (abs >= 1_000_000) body = `$${(abs / 1_000_000).toFixed(decimals)}M`
    else if (abs >= 1_000)     body = `$${(abs / 1_000).toFixed(decimals)}K`
    else                       body = `$${abs.toFixed(0)}`
  } else {
    body = `$${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  }
  if (sign) return value < 0 ? `−${body}` : `+${body}`
  return value < 0 ? `−${body}` : body
}

export function formatDelta(value: number): string {
  return formatMoney(value, { compact: true, sign: true, decimals: 1 })
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatRelative(date: string | null | undefined): string {
  if (!date) return '—'
  const diffMs = Date.now() - new Date(date).getTime()
  const m = Math.floor(diffMs / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(diffMs / 3600000)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(diffMs / 86400000)
  if (d < 7) return `${d}d ago`
  return formatDate(date)
}

// ────────────────────────────────────────────────────────────
// Semantic tones — mapped to TDDS status / magenta tokens.
// Pages compose <Badge tone={...}> never pastel-pill class soup.
// ────────────────────────────────────────────────────────────

export type Tone = 'critical' | 'high' | 'medium' | 'low' | 'monitor' | 'neutral' | 'brand' | 'success'

export function scoreTone(score: number): Tone {
  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 40) return 'medium'
  return 'monitor'
}

export function threatTone(level: string): Tone {
  const map: Record<string, Tone> = {
    critical: 'critical', high: 'high', medium: 'medium', low: 'low', monitor: 'monitor',
  }
  return map[level?.toLowerCase()] || 'monitor'
}

export function entityTypeTone(type: string): Tone {
  const map: Record<string, Tone> = {
    competitor: 'critical', target: 'brand', partner: 'success',
  }
  return map[type?.toLowerCase()] || 'neutral'
}

export function stageTone(stage: string): Tone {
  const map: Record<string, Tone> = {
    prospecting: 'monitor', discovery: 'brand', eval: 'medium',
    negotiation: 'high', closed_won: 'success', closed_lost: 'critical',
  }
  return map[stage?.toLowerCase()] || 'monitor'
}

// Solid hex for inline accents (dots, 2px borders, sparkline strokes, sliders).
// All values come from TDDS — magenta brand or status palette.
export const TONE_HEX: Record<Tone, string> = {
  critical: '#d20d00',  // TDDS status-critical-300
  high:     '#ad590b',  // TDDS status-caution-300
  medium:   '#6a6a6a',  // TDDS grayscale-600 — restrained, no pink for "medium"
  low:      '#008110',  // TDDS status-positive-300
  monitor:  '#8c8c8c',  // TDDS grayscale-500
  neutral:  '#6a6a6a',
  brand:    '#e20074',  // T-Mobile magenta — only on explicit brand moments
  success:  '#008110',
}

export const TONE_LABEL: Record<Tone, string> = {
  critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low',
  monitor: 'Monitor', neutral: 'Neutral', brand: 'Active', success: 'Good',
}

// ────────────────────────────────────────────────────────────
// DEPRECATED compat shims — pages migrate to <Badge tone={...}>.
// All chips are TDDS-grey by default. Magenta is reserved for the
// brand tone (and only used when callers explicitly opt in).
// ────────────────────────────────────────────────────────────
const TONE_SOFT: Record<Tone, string> = {
  critical: 'text-critical bg-critical/8 ring-1 ring-inset ring-critical/20',
  high:     'text-warning bg-warning/10 ring-1 ring-inset ring-warning/25',
  medium:   'text-tdds-600 bg-tdds-100 ring-1 ring-inset ring-tdds-200',
  low:      'text-success bg-success/8 ring-1 ring-inset ring-success/20',
  monitor:  'text-tdds-500 bg-tdds-100 ring-1 ring-inset ring-tdds-200',
  neutral:  'text-tdds-600 bg-tdds-100 ring-1 ring-inset ring-tdds-200',
  brand:    'text-magenta-600 bg-magenta-50 ring-1 ring-inset ring-magenta-200',
  success:  'text-success bg-success/8 ring-1 ring-inset ring-success/20',
}

export const scoreColor = (score: number) => TONE_SOFT[scoreTone(score)]
export const threatBadgeColor = (level: string) => TONE_SOFT[threatTone(level)]
export const entityTypeBadge = (type: string) => TONE_SOFT[entityTypeTone(type)]
export const stageBadgeColor = (stage: string) => TONE_SOFT[stageTone(stage)]
