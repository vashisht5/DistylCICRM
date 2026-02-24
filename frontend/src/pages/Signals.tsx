import { useState } from 'react'
import { Zap, CheckCircle } from 'lucide-react'
import { useSignals, useEntities, useReviewSignal } from '@/lib/api'
import { formatRelative, scoreColor, cn } from '@/lib/utils'
import { toast } from 'sonner'

const SIGNAL_TYPES = ['all', 'news', 'product_launch', 'exec_change', 'hiring', 'partnership', 'funding', 'email_mention', 'deal_alert']
const STATUSES = ['new', 'reviewed', 'archived']

const SIGNAL_TYPE_COLORS: Record<string, string> = {
  product_launch: 'bg-blue-100 text-blue-700',
  exec_change: 'bg-purple-100 text-purple-700',
  funding: 'bg-green-100 text-green-700',
  partnership: 'bg-teal-100 text-teal-700',
  deal_alert: 'bg-orange-100 text-orange-700',
  email_mention: 'bg-pink-100 text-pink-700',
  news: 'bg-gray-100 text-gray-600',
  hiring: 'bg-indigo-100 text-indigo-700',
  customer_win: 'bg-emerald-100 text-emerald-700',
}

export default function Signals() {
  const [entityFilter, setEntityFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('new')
  const [minScore, setMinScore] = useState(0)

  const { data: entities } = useEntities()
  const reviewSignal = useReviewSignal()

  const params: Record<string, string> = { status: statusFilter }
  if (entityFilter) params.entity_id = entityFilter
  if (typeFilter !== 'all') params.signal_type = typeFilter
  if (minScore > 0) params.min_score = minScore.toString()

  const { data } = useSignals(params)
  const signals = data?.signals ?? []

  function handleReview(id: number) {
    reviewSignal.mutate(id, {
      onSuccess: () => toast.success('Signal marked as reviewed'),
      onError: () => toast.error('Failed to update signal'),
    })
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary-600" />
          Signals
          <span className="text-sm font-normal text-gray-400">({signals.length})</span>
        </h1>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <select
          value={entityFilter}
          onChange={e => setEntityFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All entities</option>
          {entities?.entities?.map((e: any) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>

        <div className="flex gap-1 flex-wrap">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors capitalize',
                statusFilter === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {SIGNAL_TYPES.map(t => (
            <option key={t} value={t}>{t === 'all' ? 'All types' : t.replace('_', ' ')}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Min score:</span>
          <input
            type="range" min={0} max={100} step={10} value={minScore}
            onChange={e => setMinScore(parseInt(e.target.value))}
            className="w-24 accent-primary-600"
          />
          <span className="text-xs font-mono text-gray-700 w-6">{minScore}</span>
        </div>
      </div>

      {/* Signal list */}
      <div className="space-y-2">
        {signals.map((signal: any) => (
          <div key={signal.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors">
            <div className="flex items-start gap-3">
              <div className={cn('text-xs font-bold px-2 py-1 rounded border shrink-0 mt-0.5 min-w-[36px] text-center', scoreColor(signal.score))}>
                {signal.score}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={cn('text-xs px-2 py-0.5 rounded font-medium', SIGNAL_TYPE_COLORS[signal.signal_type] || SIGNAL_TYPE_COLORS.news)}>
                    {signal.signal_type?.replace('_', ' ')}
                  </span>
                  {signal.entity_name && (
                    <span className="text-xs text-primary-700 bg-primary-50 px-2 py-0.5 rounded font-medium">
                      {signal.entity_name}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900">{signal.title}</p>
                {signal.summary && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{signal.summary}</p>
                )}
                {signal.score_rationale && (
                  <p className="text-xs text-gray-400 mt-1 italic">"{signal.score_rationale}"</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-gray-400">{formatRelative(signal.source_date)}</span>
                  {signal.source_name && <span className="text-xs text-gray-400">{signal.source_name}</span>}
                  {signal.source_url && (
                    <a href={signal.source_url} target="_blank" rel="noreferrer" className="text-xs text-primary-600 hover:underline">
                      Source →
                    </a>
                  )}
                </div>
              </div>
              {signal.status === 'new' && (
                <button
                  onClick={() => handleReview(signal.id)}
                  disabled={reviewSignal.isPending}
                  className="shrink-0 flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        {signals.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No signals in this view</p>
          </div>
        )}
      </div>
    </div>
  )
}
