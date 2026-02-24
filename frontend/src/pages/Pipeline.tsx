import { useState } from 'react'
import { GitBranch, Plus, Loader2 } from 'lucide-react'
import { useDeals, useCreateDeal, useUpdateDeal, useCompetitiveMap, useEntities } from '@/lib/api'
import { formatDate, stageBadgeColor, cn } from '@/lib/utils'
import { toast } from 'sonner'

const STAGES = ['prospecting', 'discovery', 'eval', 'negotiation', 'closed_won', 'closed_lost']
const DISTYL_PRODUCTS = ['Eagle', 'Tower', 'Penny', 'Platform']

function formatValue(v?: number) {
  if (!v) return '—'
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`
  return `$${v}`
}

function AddDealModal({ onClose }: { onClose: () => void }) {
  const createDeal = useCreateDeal()
  const { data: entities } = useEntities()
  const [form, setForm] = useState({
    account_name: '', deal_name: '', stage: 'prospecting',
    value_usd: '', owner: '', distyl_product: 'Eagle',
    close_date: '', loss_competitor_id: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createDeal.mutateAsync({
        ...form,
        value_usd: form.value_usd ? parseInt(form.value_usd) : null,
        loss_competitor_id: form.loss_competitor_id ? parseInt(form.loss_competitor_id) : null,
      })
      toast.success('Deal created')
      onClose()
    } catch {
      toast.error('Failed to create deal')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Add Deal</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700">Account Name *</label>
            <input
              required value={form.account_name}
              onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. Ensemble Health Partners"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Deal Name *</label>
            <input
              required value={form.deal_name}
              onChange={e => setForm(f => ({ ...f, deal_name: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Stage</label>
              <select
                value={form.stage}
                onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {STAGES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Product</label>
              <select
                value={form.distyl_product}
                onChange={e => setForm(f => ({ ...f, distyl_product: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {DISTYL_PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Value (USD)</label>
              <input
                type="number" value={form.value_usd}
                onChange={e => setForm(f => ({ ...f, value_usd: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="500000"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Owner</label>
              <input
                value={form.owner}
                onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="AE name"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Close Date</label>
            <input
              type="date" value={form.close_date}
              onChange={e => setForm(f => ({ ...f, close_date: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button
              type="submit"
              disabled={createDeal.isPending}
              className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {createDeal.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create Deal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Pipeline() {
  const [showAdd, setShowAdd] = useState(false)
  const [stageFilter, setStageFilter] = useState('all')
  const [view, setView] = useState<'list' | 'competitive'>('list')

  const { data } = useDeals(stageFilter !== 'all' ? { stage: stageFilter } : undefined)
  const { data: compMap } = useCompetitiveMap()
  const deals = data?.deals ?? []

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-primary-600" />
          Pipeline
          <span className="text-sm font-normal text-gray-400">({deals.length} deals)</span>
        </h1>
        <div className="flex gap-2">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={cn('text-xs px-3 py-1.5 font-medium transition-colors', view === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50')}
            >
              Deals
            </button>
            <button
              onClick={() => setView('competitive')}
              className={cn('text-xs px-3 py-1.5 font-medium transition-colors', view === 'competitive' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50')}
            >
              Competitive Map
            </button>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Deal
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <>
          {/* Stage filter */}
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setStageFilter('all')}
              className={cn('text-xs px-2.5 py-1.5 rounded-lg font-medium', stageFilter === 'all' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}
            >
              All
            </button>
            {STAGES.map(s => (
              <button
                key={s}
                onClick={() => setStageFilter(s)}
                className={cn('text-xs px-2.5 py-1.5 rounded-lg font-medium capitalize', stageFilter === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Account</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Owner</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Close</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Competitors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deals.map((deal: any) => (
                  <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{deal.account_name}</div>
                      <div className="text-xs text-gray-400">{deal.deal_name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded font-medium', stageBadgeColor(deal.stage))}>
                        {deal.stage?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{deal.distyl_product}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-700">{formatValue(deal.value_usd)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{deal.owner || '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{deal.close_date ? formatDate(deal.close_date) : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {deal.competitors?.map((c: any) => (
                          <span key={c.id} className="text-xs bg-red-50 text-red-700 px-1.5 py-0.5 rounded">{c.entity_name}</span>
                        ))}
                        {!deal.competitors?.length && <span className="text-xs text-gray-300">None identified</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {deals.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <GitBranch className="w-7 h-7 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No deals yet</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Competitive map */
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Deal × Competitor Matrix</h2>
          {compMap?.matrix ? (
            <div className="overflow-x-auto">
              <table className="text-xs">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-500">Account</th>
                    {compMap.competitors?.map((c: string) => (
                      <th key={c} className="px-3 py-2 text-center text-gray-500 font-medium">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {compMap.matrix.map((row: any) => (
                    <tr key={row.deal_id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-900">{row.account_name}</td>
                      {compMap.competitors?.map((c: string) => (
                        <td key={c} className="px-3 py-2 text-center">
                          {row.competitors[c] ? (
                            <span className="text-red-500 font-bold">✓</span>
                          ) : (
                            <span className="text-gray-200">·</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">No competitive data available</p>
          )}
        </div>
      )}

      {showAdd && <AddDealModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
