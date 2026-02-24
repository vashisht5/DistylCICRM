import { useState } from 'react'
import { BookOpen, Loader2, Send } from 'lucide-react'
import { useDigests, useDigest, useGenerateDigest, usePostDigestToSlack } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'
import { toast } from 'sonner'

function DigestContent({ digestId }: { digestId: number }) {
  const { data } = useDigest(digestId)
  const postToSlack = usePostDigestToSlack()
  const digest = data?.digest

  if (!digest) return <div className="p-6 text-gray-400 text-sm">Loading...</div>

  const content = digest.content ?? {}

  return (
    <div className="p-5 space-y-4 overflow-y-auto h-full">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{digest.subject}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn('text-xs px-2 py-0.5 rounded border font-medium',
              digest.digest_type === 'competitor_focus'
                ? 'bg-red-100 text-red-700 border-red-200'
                : 'bg-blue-100 text-blue-700 border-blue-200'
            )}>
              {digest.digest_type?.replace('_', ' ')}
            </span>
            <span className="text-xs text-gray-500">Week {digest.week_number}, {digest.year}</span>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {digest.slack_posted && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-200">
              Posted to Slack
            </span>
          )}
          {!digest.slack_posted && digest.status === 'completed' && (
            <button
              onClick={() => postToSlack.mutate(digest.id, { onSuccess: () => toast.success('Posted to Slack') })}
              disabled={postToSlack.isPending}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {postToSlack.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Post to Slack
            </button>
          )}
        </div>
      </div>

      {content.summary && (
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
          <p className="text-sm text-primary-800">{content.summary}</p>
        </div>
      )}

      {content.top_signals && (
        <div className="border border-gray-100 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Signals</h3>
          <div className="space-y-2">
            {content.top_signals.map((sig: any, i: number) => (
              <div key={i} className="flex gap-2">
                <span className="text-xs font-bold bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded shrink-0">{sig.score}</span>
                <div>
                  <p className="text-sm text-gray-800">{sig.title}</p>
                  <p className="text-xs text-gray-500">{sig.entity_name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {content.exec_moves && content.exec_moves.length > 0 && (
        <div className="border border-gray-100 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Executive Movements</h3>
          <div className="space-y-2">
            {content.exec_moves.map((move: any, i: number) => (
              <div key={i} className="text-sm text-gray-700">
                <span className="font-medium">{move.name}</span>
                {move.from_company && ` left ${move.from_company}`}
                {move.to_company && ` → joined ${move.to_company}`}
              </div>
            ))}
          </div>
        </div>
      )}

      {content.deal_updates && content.deal_updates.length > 0 && (
        <div className="border border-gray-100 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Deal Updates</h3>
          <div className="space-y-1">
            {content.deal_updates.map((upd: any, i: number) => (
              <p key={i} className="text-sm text-gray-600">{typeof upd === 'string' ? upd : upd.summary}</p>
            ))}
          </div>
        </div>
      )}

      {content.key_actions && (
        <div className="border border-orange-100 bg-orange-50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-orange-900 mb-3">Recommended Actions</h3>
          <ul className="space-y-1">
            {(Array.isArray(content.key_actions) ? content.key_actions : [content.key_actions]).map((action: string, i: number) => (
              <li key={i} className="text-sm text-orange-800 flex gap-1.5">
                <span className="shrink-0">→</span><span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-400">{digest.generated_at ? `Generated ${formatDate(digest.generated_at)}` : ''}</p>
    </div>
  )
}

export default function Digests() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const { data } = useDigests()
  const generateDigest = useGenerateDigest()
  const digests = data?.digests ?? []

  return (
    <div className="flex h-full">
      {/* List */}
      <div className="w-64 border-r border-gray-200 bg-white flex flex-col shrink-0">
        <div className="p-3 border-b border-gray-100 flex items-center justify-between">
          <h1 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-primary-600" /> Digests
          </h1>
          <button
            onClick={() => generateDigest.mutate(undefined, {
              onSuccess: () => toast.success('Digest generation started'),
              onError: () => toast.error('Generation failed'),
            })}
            disabled={generateDigest.isPending}
            className="flex items-center gap-1 text-xs px-2 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {generateDigest.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : '+ New'}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {digests.map((digest: any) => (
            <button
              key={digest.id}
              onClick={() => setSelectedId(digest.id)}
              className={cn('w-full text-left px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 transition-colors', selectedId === digest.id && 'bg-primary-50')}
            >
              <div className="text-xs font-medium text-gray-900 line-clamp-2">{digest.subject || `Digest — Week ${digest.week_number}, ${digest.year}`}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium',
                  digest.digest_type === 'competitor_focus' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700')}>
                  {digest.digest_type?.replace('_', ' ')}
                </span>
                {digest.slack_posted && <span className="text-[10px] text-green-600">✓ Slack</span>}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">{formatDate(digest.generated_at)}</div>
            </button>
          ))}
          {digests.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-xs px-4">
              No digests yet. Generate your first bi-weekly digest.
            </div>
          )}
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 overflow-hidden">
        {selectedId ? (
          <DigestContent digestId={selectedId} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Select a digest to preview</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
