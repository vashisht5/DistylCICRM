import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, TrendingUp, AlertTriangle, Users, Building2, Activity } from 'lucide-react'
import { useSignalStats, useEntityStats, useNewsStats, useSignals, useNews } from '@/lib/api'
import { useSSE } from '@/hooks/useSSE'
import { formatRelative, scoreColor, threatBadgeColor } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface LiveItem { headline: string; source_name: string; entity_name?: string; published_at: string }

function StatCard({ label, value, sub, color = 'gray' }: { label: string; value: number | string; sub?: string; color?: string }) {
  const colors: Record<string, string> = {
    purple: 'bg-primary-50 border-primary-200',
    red: 'bg-red-50 border-red-200',
    orange: 'bg-orange-50 border-orange-200',
    green: 'bg-green-50 border-green-200',
    gray: 'bg-gray-50 border-gray-200',
  }
  return (
    <div className={cn('rounded-xl border p-4', colors[color] || colors.gray)}>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm font-medium text-gray-700 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function WarRoom() {
  const navigate = useNavigate()
  const { data: sigStats } = useSignalStats()
  const { data: entStats } = useEntityStats()
  const { data: newsStats } = useNewsStats()
  const { data: signals } = useSignals({ status: 'new' })
  const { data: newsItems } = useNews({ limit: '20' } as any)

  const [ticker, setTicker] = useState<LiveItem[]>([])
  const [tickerIdx, setTickerIdx] = useState(0)

  useSSE('/api/news/live', (data: unknown) => {
    const item = data as LiveItem
    setTicker(prev => [item, ...prev].slice(0, 50))
  })

  // Seed ticker from existing news
  useEffect(() => {
    if (newsItems?.news?.length) {
      setTicker(newsItems.news.slice(0, 20))
    }
  }, [newsItems])

  // Rotate ticker
  useEffect(() => {
    if (ticker.length === 0) return
    const timer = setInterval(() => setTickerIdx(i => (i + 1) % ticker.length), 5000)
    return () => clearInterval(timer)
  }, [ticker.length])

  const current = ticker[tickerIdx]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-600" />
          War Room
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Live competitive intelligence — what the AI is watching right now</p>
      </div>

      {/* Live news ticker */}
      {current && (
        <div className="bg-primary-600 text-white rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded shrink-0">LIVE</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{current.headline}</p>
            <p className="text-xs text-primary-200 mt-0.5">
              {current.source_name} · {formatRelative(current.published_at)}
              {current.entity_name && ` · ${current.entity_name}`}
            </p>
          </div>
          <button onClick={() => navigate('/news')} className="text-xs text-primary-200 hover:text-white shrink-0 transition-colors">
            View all →
          </button>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="New Signals" value={sigStats?.total_new ?? 0} sub="requiring review" color="purple" />
        <StatCard label="High Priority" value={sigStats?.high_score ?? 0} sub="score ≥ 80" color="red" />
        <StatCard label="Active Entities" value={entStats?.total ?? 0} sub="being tracked" color="green" />
        <StatCard label="News Today" value={newsStats?.total ?? 0} sub="from all sources" color="orange" />
      </div>

      {/* Signals + Entity threat levels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top signals */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-primary-500" /> Top Signals
            </h2>
            <button onClick={() => navigate('/signals')} className="text-xs text-primary-600 hover:text-primary-700">View all →</button>
          </div>
          <div className="space-y-2">
            {signals?.signals?.slice(0, 5).map((sig: any) => (
              <div key={sig.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate('/signals')}>
                <div className={cn('text-xs font-bold px-1.5 py-0.5 rounded border shrink-0 mt-0.5', scoreColor(sig.score))}>
                  {sig.score}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-800 font-medium line-clamp-2">{sig.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{sig.entity_name} · {formatRelative(sig.source_date)}</p>
                </div>
              </div>
            ))}
            {!signals?.signals?.length && (
              <p className="text-sm text-gray-400 text-center py-4">No new signals</p>
            )}
          </div>
        </div>

        {/* Entity threat heatmap */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-orange-500" /> Threat Levels
            </h2>
            <button onClick={() => navigate('/entities')} className="text-xs text-primary-600 hover:text-primary-700">View entities →</button>
          </div>
          <div className="space-y-2">
            {entStats?.by_threat && Object.entries(entStats.by_threat).map(([level, count]: [string, any]) => (
              <div key={level} className="flex items-center gap-2">
                <span className={cn('text-xs font-semibold px-2 py-0.5 rounded border w-20 text-center', threatBadgeColor(level))}>
                  {level}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-primary-500 transition-all"
                    style={{ width: `${Math.min(100, (count / (entStats?.total || 1)) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-700 w-6 text-right">{count}</span>
              </div>
            ))}
            {!entStats?.by_threat?.length && (
              <p className="text-sm text-gray-400 text-center py-4">No entity data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Source breakdown */}
      {newsStats?.by_source && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-green-500" /> News by Source (Last 24h)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(newsStats.by_source).map(([source, count]: [string, any]) => (
              <div key={source} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-900">{count}</div>
                <div className="text-xs text-gray-500 capitalize">{source.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
