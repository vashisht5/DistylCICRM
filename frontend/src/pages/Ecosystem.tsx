import { useCallback, useEffect, useState } from 'react'
import { Network, Plus, Loader2 } from 'lucide-react'
import { usePartnerships, usePartnershipGraph, useCreatePartnership, useEntities } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'
import { toast } from 'sonner'

// Simple SVG-based force layout (avoiding xyflow dependency issues at runtime)
function GraphViz({ nodes, edges }: { nodes: any[]; edges: any[] }) {
  const [positions, setPositions] = useState<Record<string | number, { x: number; y: number }>>({})

  useEffect(() => {
    // Simple circular layout
    const pos: Record<string | number, { x: number; y: number }> = {}
    const cx = 400, cy = 250, r = 180
    nodes.forEach((n, i) => {
      const angle = (i / nodes.length) * 2 * Math.PI
      pos[n.id] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
    })
    setPositions(pos)
  }, [nodes.length])

  if (nodes.length === 0) return (
    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
      No partnership data. Add partnerships to see the ecosystem graph.
    </div>
  )

  const TYPE_COLORS: Record<string, string> = {
    competitor: '#ef4444',
    target: '#3b82f6',
    partner: '#22c55e',
  }

  return (
    <svg className="w-full h-full" viewBox="0 0 800 500">
      {/* Edges */}
      {edges.map((edge, i) => {
        const s = positions[edge.source]
        const t = positions[edge.target]
        if (!s || !t) return null
        return (
          <line
            key={i}
            x1={s.x} y1={s.y}
            x2={t.x} y2={t.y}
            stroke="#e5e7eb"
            strokeWidth={edge.strength === 'deep' ? 3 : edge.strength === 'moderate' ? 2 : 1}
            strokeDasharray={edge.strength === 'rumored' ? '4,4' : undefined}
          />
        )
      })}
      {/* Nodes */}
      {nodes.map(node => {
        const p = positions[node.id]
        if (!p) return null
        const entityType = node.data?.entity_type || node.entity_type
        const label = node.data?.label || node.label || node.id
        const color = TYPE_COLORS[entityType] || '#94a3b8'
        return (
          <g key={node.id} transform={`translate(${p.x},${p.y})`} className="cursor-pointer">
            <circle r={20} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={2} />
            <text textAnchor="middle" dy={35} className="text-xs" fill="#374151" fontSize={11} fontWeight={500}>
              {label.length > 12 ? label.slice(0, 11) + '…' : label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function AddPartnershipModal({ onClose }: { onClose: () => void }) {
  const { data: entities } = useEntities()
  const createPartnership = useCreatePartnership()
  const [form, setForm] = useState({
    entity_a_id: '', entity_b_id: '',
    partnership_type: 'technology', description: '',
    strength: 'moderate', source_url: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createPartnership.mutateAsync({
        ...form,
        entity_a_id: parseInt(form.entity_a_id),
        entity_b_id: parseInt(form.entity_b_id),
      })
      toast.success('Partnership added')
      onClose()
    } catch {
      toast.error('Failed to create partnership')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Add Partnership</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Entity A *</label>
              <select required value={form.entity_a_id} onChange={e => setForm(f => ({ ...f, entity_a_id: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Select...</option>
                {entities?.entities?.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Entity B *</label>
              <select required value={form.entity_b_id} onChange={e => setForm(f => ({ ...f, entity_b_id: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">Select...</option>
                {entities?.entities?.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Type</label>
              <select value={form.partnership_type} onChange={e => setForm(f => ({ ...f, partnership_type: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                {['technology', 'channel', 'strategic', 'OEM', 'investor'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Strength</label>
              <select value={form.strength} onChange={e => setForm(f => ({ ...f, strength: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                {['deep', 'moderate', 'surface', 'rumored'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Source URL</label>
            <input value={form.source_url} onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://..." />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={createPartnership.isPending}
              className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
              {createPartnership.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Add Partnership
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Ecosystem() {
  const [showAdd, setShowAdd] = useState(false)
  const { data: graphData } = usePartnershipGraph()
  const { data: partnershipsData } = usePartnerships()
  const partnerships = partnershipsData?.partnerships ?? []

  const TYPE_COLORS: Record<string, string> = {
    technology: 'bg-blue-100 text-blue-700',
    channel: 'bg-purple-100 text-purple-700',
    strategic: 'bg-orange-100 text-orange-700',
    OEM: 'bg-gray-100 text-gray-600',
    investor: 'bg-green-100 text-green-700',
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Network className="w-5 h-5 text-primary-600" />
          Ecosystem
        </h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Partnership
        </button>
      </div>

      {/* Graph */}
      <div className="bg-white rounded-xl border border-gray-200 h-[400px] overflow-hidden">
        <div className="p-3 border-b border-gray-100 flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> Competitor
            <span className="w-3 h-3 rounded-full bg-blue-400 inline-block ml-2" /> Target
            <span className="w-3 h-3 rounded-full bg-green-400 inline-block ml-2" /> Partner
          </div>
        </div>
        <div className="h-[calc(100%-44px)]">
          {graphData ? (
            <GraphViz nodes={graphData.nodes ?? []} edges={graphData.edges ?? []} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Loading graph...
            </div>
          )}
        </div>
      </div>

      {/* Partnership list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">All Partnerships ({partnerships.length})</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {partnerships.map((p: any) => (
            <div key={p.id} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{p.entity_a_name}</span>
                  <span className="text-gray-300">↔</span>
                  <span className="text-sm font-medium text-gray-900">{p.entity_b_name}</span>
                </div>
                {p.description && <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>}
              </div>
              <div className="flex gap-1.5 items-center shrink-0">
                <span className={cn('text-xs px-2 py-0.5 rounded font-medium', TYPE_COLORS[p.partnership_type] || 'bg-gray-100 text-gray-600')}>
                  {p.partnership_type}
                </span>
                <span className="text-xs text-gray-400">{p.strength}</span>
              </div>
              {p.announced_date && (
                <span className="text-xs text-gray-400 shrink-0">{formatDate(p.announced_date)}</span>
              )}
            </div>
          ))}
          {partnerships.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              No partnerships tracked yet
            </div>
          )}
        </div>
      </div>

      {showAdd && <AddPartnershipModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
