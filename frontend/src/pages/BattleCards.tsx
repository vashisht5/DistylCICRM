import { useState } from 'react'
import { Swords, Plus, CheckCircle, Loader2 } from 'lucide-react'
import { useBattleCards, useBattleCard, useGenerateBattleCard, useApproveBattleCard, useEntities } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'
import { toast } from 'sonner'

const DISTYL_PRODUCTS = ['Eagle', 'Tower', 'Penny', 'Platform']
const USE_CASES = [
  'Prior Authorization', 'Claims Processing', 'Appeals Management',
  'Case Summarization', 'Utilization Management', 'CX for Healthcare', 'General'
]

function GenerateModal({ onClose }: { onClose: () => void }) {
  const { data: entities } = useEntities()
  const generate = useGenerateBattleCard()
  const [form, setForm] = useState({ entity_id: '', use_case: 'Claims Processing', distyl_product: 'Tower' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await generate.mutateAsync({ ...form, entity_id: parseInt(form.entity_id) })
      toast.success('Battle card generation started')
      onClose()
    } catch {
      toast.error('Generation failed')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="p-5 border-b border-gray-100"><h2 className="font-semibold text-gray-900">Generate Battle Card</h2></div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700">Competitor *</label>
            <select required value={form.entity_id} onChange={e => setForm(f => ({ ...f, entity_id: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Select competitor...</option>
              {entities?.entities?.filter((e: any) => e.entity_type === 'competitor').map((e: any) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Use Case</label>
            <select value={form.use_case} onChange={e => setForm(f => ({ ...f, use_case: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              {USE_CASES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Distyl Product</label>
            <select value={form.distyl_product} onChange={e => setForm(f => ({ ...f, distyl_product: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              {DISTYL_PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={generate.isPending}
              className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
              {generate.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Generate
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BattleCardDetail({ cardId }: { cardId: number }) {
  const { data } = useBattleCard(cardId)
  const approve = useApproveBattleCard()
  const card = data?.battle_card

  if (!card) return <div className="p-6 text-gray-400 text-sm">Loading...</div>

  const content = card.content ?? {}

  return (
    <div className="p-5 space-y-4 overflow-y-auto h-full">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{card.entity_name}</h2>
          <p className="text-sm text-gray-500">{card.use_case} · {card.distyl_product}</p>
        </div>
        <div className="flex gap-2 items-center">
          <span className={cn('text-xs px-2 py-0.5 rounded border font-medium',
            card.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
            'bg-yellow-100 text-yellow-700 border-yellow-200'
          )}>
            {card.status}
          </span>
          {card.status === 'draft' && (
            <button
              onClick={() => approve.mutate(card.id, { onSuccess: () => toast.success('Battle card approved') })}
              disabled={approve.isPending}
              className="flex items-center gap-1 text-xs px-2.5 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle className="w-3 h-3" /> Approve
            </button>
          )}
        </div>
      </div>

      {Object.entries(content).map(([key, value]: [string, any]) => (
        <div key={key} className="border border-gray-100 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 capitalize">
            {key.replace(/_/g, ' ')}
          </h3>
          {typeof value === 'string' ? (
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{value}</p>
          ) : Array.isArray(value) ? (
            <ul className="space-y-1">
              {value.map((item: any, i: number) => (
                <li key={i} className="text-sm text-gray-600 flex gap-1.5">
                  <span className="text-primary-400 shrink-0">•</span>
                  <span>{typeof item === 'string' ? item : JSON.stringify(item)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <pre className="text-xs text-gray-600 whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
          )}
        </div>
      ))}
      <p className="text-xs text-gray-400">{card.generated_at ? `Generated ${formatDate(card.generated_at)}` : ''}</p>
    </div>
  )
}

export default function BattleCards() {
  const [showGenerate, setShowGenerate] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const params: Record<string, string> = {}
  if (statusFilter !== 'all') params.status = statusFilter

  const { data } = useBattleCards(params)
  const cards = data?.battle_cards ?? []

  return (
    <div className="flex h-full">
      {/* List */}
      <div className="w-72 border-r border-gray-200 bg-white flex flex-col shrink-0">
        <div className="p-3 border-b border-gray-100 flex items-center justify-between">
          <h1 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <Swords className="w-4 h-4 text-primary-600" /> Battle Cards
          </h1>
          <button
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-1 text-xs px-2 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-3 h-3" /> New
          </button>
        </div>
        <div className="p-2 border-b border-gray-100 flex gap-1">
          {['all', 'draft', 'approved'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn('flex-1 text-xs py-1 rounded font-medium capitalize', statusFilter === s ? 'bg-primary-600 text-white' : 'text-gray-500 hover:bg-gray-50')}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {cards.map((card: any) => (
            <button key={card.id} onClick={() => setSelectedId(card.id)}
              className={cn('w-full text-left px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 transition-colors',
                selectedId === card.id && 'bg-primary-50')}>
              <div className="text-sm font-medium text-gray-900 truncate">{card.entity_name}</div>
              <div className="text-xs text-gray-500 truncate">{card.use_case} · {card.distyl_product}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium',
                  card.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                  {card.status}
                </span>
              </div>
            </button>
          ))}
          {cards.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-xs px-4">
              No battle cards yet. Generate one for a competitor.
            </div>
          )}
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 overflow-hidden">
        {selectedId ? (
          <BattleCardDetail cardId={selectedId} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <Swords className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Select a battle card to preview</p>
            </div>
          </div>
        )}
      </div>

      {showGenerate && <GenerateModal onClose={() => setShowGenerate(false)} />}
    </div>
  )
}
