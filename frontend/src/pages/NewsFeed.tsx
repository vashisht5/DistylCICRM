import { useState } from 'react'
import { RefreshCw, Newspaper } from 'lucide-react'
import { useNews, useEntities, useRefreshNews } from '@/lib/api'
import { useSSE } from '@/hooks/useSSE'
import { formatRelative, scoreColor } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const SOURCE_TYPES = ['all', 'newsapi', 'perplexity', 'rss', 'claude_search']

export default function NewsFeed() {
  const [entityFilter, setEntityFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [liveItems, setLiveItems] = useState<any[]>([])

  const { data: entities } = useEntities()
  const params: Record<string, string> = {}
  if (entityFilter) params.entity_id = entityFilter
  if (sourceFilter !== 'all') params.source_type = sourceFilter

  const { data: newsData, refetch } = useNews(params)
  const refreshMutation = useRefreshNews()

  useSSE('/api/news/live', (data: unknown) => {
    setLiveItems(prev => [data as any, ...prev].slice(0, 10))
  })

  function handleRefresh() {
    if (entityFilter) {
      refreshMutation.mutate(parseInt(entityFilter), {
        onSuccess: () => { toast.success('News refresh triggered'); refetch() },
        onError: () => toast.error('Refresh failed'),
      })
    } else {
      refetch()
      toast.success('Feed refreshed')
    }
  }

  const allItems = [...liveItems, ...(newsData?.news ?? [])]

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-primary-600" />
          News Feed
          {liveItems.length > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              {liveItems.length} live
            </span>
          )}
        </h1>
        <button
          onClick={handleRefresh}
          disabled={refreshMutation.isPending}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', refreshMutation.isPending && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
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
        <div className="flex gap-1">
          {SOURCE_TYPES.map(s => (
            <button
              key={s}
              onClick={() => setSourceFilter(s)}
              className={cn(
                'text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors capitalize',
                sourceFilter === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              )}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-2">
        {allItems.map((item: any, idx: number) => (
          <div
            key={item.id ?? `live-${idx}`}
            className={cn(
              'bg-white rounded-xl border p-4 transition-all',
              idx < liveItems.length ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {item.entity_name && (
                    <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                      {item.entity_name}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 capitalize">{item.source_type?.replace('_', ' ')}</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-400">{item.source_name}</span>
                  {idx < liveItems.length && (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">NEW</span>
                  )}
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors"
                >
                  {item.headline}
                </a>
                {item.summary && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.summary}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{formatRelative(item.published_at)}</p>
              </div>
              {item.relevance_score > 0 && (
                <div className={cn('text-xs font-bold px-1.5 py-0.5 rounded border shrink-0', scoreColor(item.relevance_score))}>
                  {item.relevance_score}
                </div>
              )}
            </div>
          </div>
        ))}
        {allItems.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No news items yet. Trigger a refresh to fetch news.</p>
          </div>
        )}
      </div>
    </div>
  )
}
