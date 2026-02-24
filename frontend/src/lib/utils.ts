import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatRelative(date: string | null | undefined): string {
  if (!date) return '—'
  const diffMs = Date.now() - new Date(date).getTime()
  const m = Math.floor(diffMs / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(diffMs / 3600000)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(diffMs / 86400000)
  if (d < 7) return `${d}d ago`
  return formatDate(date)
}

export function scoreColor(score: number): string {
  if (score >= 80) return 'text-red-600 bg-red-50 border-red-200'
  if (score >= 60) return 'text-orange-600 bg-orange-50 border-orange-200'
  if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
  return 'text-gray-500 bg-gray-50 border-gray-200'
}

export function threatBadgeColor(level: string): string {
  const map: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
    monitor: 'bg-gray-100 text-gray-600 border-gray-200',
  }
  return map[level] || map.monitor
}

export function entityTypeBadge(type: string): string {
  const map: Record<string, string> = {
    competitor: 'bg-red-50 text-red-700 border-red-200',
    target: 'bg-blue-50 text-blue-700 border-blue-200',
    partner: 'bg-green-50 text-green-700 border-green-200',
  }
  return map[type] || 'bg-gray-50 text-gray-600 border-gray-200'
}

export function stageBadgeColor(stage: string): string {
  const map: Record<string, string> = {
    prospecting: 'bg-gray-100 text-gray-600',
    discovery: 'bg-blue-100 text-blue-700',
    eval: 'bg-purple-100 text-purple-700',
    negotiation: 'bg-orange-100 text-orange-700',
    closed_won: 'bg-green-100 text-green-700',
    closed_lost: 'bg-red-100 text-red-700',
  }
  return map[stage] || 'bg-gray-100 text-gray-600'
}
