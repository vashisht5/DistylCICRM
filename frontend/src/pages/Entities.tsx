import { useState } from 'react'
import { Plus, Building2, TrendingUp, Loader2 } from 'lucide-react'
import { useEntities, useCreateEntity, useEntityStats } from '@/lib/api'
import { useNavigate } from 'react-router-dom'
import { threatBadgeColor, entityTypeBadge, cn } from '@/lib/utils'
import { toast } from 'sonner'

const ENTITY_TYPES = ['all', 'competitor', 'target', 'partner']
const THREAT_LEVELS = ['all', 'critical', 'high', 'medium', 'low', 'monitor']

function EntityCard({ entity, onClick }: { entity: any; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-300 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{entity.name}</h3>
          {entity.headquarters && (
            <p className="text-xs text-gray-400 mt-0.5">{entity.headquarters}</p>
          )}
        </div>
        <div className="flex gap-1.5 ml-2 shrink-0">
          <span className={cn('text-xs px-2 py-0.5 rounded border font-medium', entityTypeBadge(entity.entity_type))}>
            {entity.entity_type}
          </span>
        </div>
      </div>

      {entity.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{entity.description}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn('text-xs px-2 py-0.5 rounded border font-medium', threatBadgeColor(entity.threat_level))}>
          {entity.threat_level}
        </span>
        {entity.distyl_exposure && entity.distyl_exposure !== 'none' && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            {entity.distyl_exposure} exposure
          </span>
        )}
        {entity.signal_count > 0 && (
          <span className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded ml-auto">
            {entity.signal_count} signals
          </span>
        )}
      </div>
    </div>
  )
}

function AddEntityModal({ onClose }: { onClose: () => void }) {
  const createEntity = useCreateEntity()
  const [form, setForm] = useState({
    name: '', entity_type: 'competitor', website: '', description: '',
    headquarters: '', threat_level: 'medium', distyl_exposure: 'low',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createEntity.mutateAsync(form)
      toast.success(`${form.name} added successfully`)
      onClose()
    } catch {
      toast.error('Failed to create entity')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Add Entity</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700">Company Name *</label>
            <input
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. Cohere"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Type</label>
              <select
                value={form.entity_type}
                onChange={e => setForm(f => ({ ...f, entity_type: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="competitor">Competitor</option>
                <option value="target">Target</option>
                <option value="partner">Partner</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Threat Level</label>
              <select
                value={form.threat_level}
                onChange={e => setForm(f => ({ ...f, threat_level: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {THREAT_LEVELS.slice(1).map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Website</label>
            <input
              value={form.website}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createEntity.isPending}
              className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {createEntity.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Add Entity
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Entities() {
  const navigate = useNavigate()
  const [typeFilter, setTypeFilter] = useState('all')
  const [threatFilter, setThreatFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const params: Record<string, string> = {}
  if (typeFilter !== 'all') params.entity_type = typeFilter
  if (threatFilter !== 'all') params.threat_level = threatFilter

  const { data } = useEntities(params)

  const entities = (data?.entities ?? []).filter((e: any) =>
    !search || e.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary-600" />
          Entities
          <span className="text-sm font-normal text-gray-400">({entities.length})</span>
        </h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Entity
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search entities..."
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 w-48"
        />
        <div className="flex gap-1">
          {ENTITY_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                'text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors capitalize',
                typeFilter === t ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {['all', 'critical', 'high', 'medium'].map(t => (
            <button
              key={t}
              onClick={() => setThreatFilter(t)}
              className={cn(
                'text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors capitalize',
                threatFilter === t ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {entities.map((entity: any) => (
          <EntityCard
            key={entity.id}
            entity={entity}
            onClick={() => navigate(`/dossiers/${entity.id}`)}
          />
        ))}
        {entities.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400">
            <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No entities found</p>
          </div>
        )}
      </div>

      {showAdd && <AddEntityModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
