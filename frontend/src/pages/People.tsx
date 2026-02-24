import { useState } from 'react'
import { Users, Plus, Loader2, ExternalLink } from 'lucide-react'
import { usePeople, useEntities, useCreatePerson } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'
import { toast } from 'sonner'

const PERSON_TYPES = ['all', 'executive', 'champion', 'detractor', 'target_contact']
const RELATIONSHIP_TYPES = ['all', 'ally', 'neutral', 'hostile', 'unknown']

const REL_COLORS: Record<string, string> = {
  ally: 'bg-green-100 text-green-700',
  neutral: 'bg-gray-100 text-gray-600',
  hostile: 'bg-red-100 text-red-700',
  unknown: 'bg-gray-100 text-gray-400',
}

function AddPersonModal({ onClose }: { onClose: () => void }) {
  const { data: entities } = useEntities()
  const createPerson = useCreatePerson()
  const [form, setForm] = useState({
    entity_id: '', first_name: '', last_name: '', title: '',
    current_company: '', email: '', linkedin_url: '',
    person_type: 'executive', distyl_relationship: 'unknown',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      await createPerson.mutateAsync({ ...form, entity_id: parseInt(form.entity_id) })
      toast.success('Person added')
      onClose()
    } catch {
      toast.error('Failed to add person')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Add Person</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-700">Entity *</label>
            <select
              required
              value={form.entity_id}
              onChange={e => setForm(f => ({ ...f, entity_id: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select entity...</option>
              {entities?.entities?.map((e: any) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">First Name *</label>
              <input
                required value={form.first_name}
                onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Last Name *</label>
              <input
                required value={form.last_name}
                onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">Title</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. VP of Sales"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700">LinkedIn URL</label>
            <input
              value={form.linkedin_url}
              onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="https://linkedin.com/in/..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Type</label>
              <select
                value={form.person_type}
                onChange={e => setForm(f => ({ ...f, person_type: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {PERSON_TYPES.slice(1).map(t => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Relationship</label>
              <select
                value={form.distyl_relationship}
                onChange={e => setForm(f => ({ ...f, distyl_relationship: e.target.value }))}
                className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {RELATIONSHIP_TYPES.slice(1).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button
              type="submit"
              disabled={createPerson.isPending}
              className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {createPerson.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Add Person
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function People() {
  const [entityFilter, setEntityFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [relFilter, setRelFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)

  const { data: entities } = useEntities()
  const params: Record<string, string> = {}
  if (entityFilter) params.entity_id = entityFilter
  if (typeFilter !== 'all') params.person_type = typeFilter
  if (relFilter !== 'all') params.distyl_relationship = relFilter

  const { data } = usePeople(params)
  const people = data?.people ?? []

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-600" />
          People
          <span className="text-sm font-normal text-gray-400">({people.length})</span>
        </h1>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Person
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
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {PERSON_TYPES.map(t => (
            <option key={t} value={t}>{t === 'all' ? 'All types' : t.replace('_', ' ')}</option>
          ))}
        </select>
        <div className="flex gap-1">
          {RELATIONSHIP_TYPES.map(r => (
            <button
              key={r}
              onClick={() => setRelFilter(r)}
              className={cn(
                'text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors capitalize',
                relFilter === r ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Person</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Entity</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Relationship</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Move</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Links</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {people.map((person: any) => (
              <tr key={person.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{person.first_name} {person.last_name}</div>
                  {person.title && <div className="text-xs text-gray-500">{person.title}</div>}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-primary-700 bg-primary-50 px-2 py-0.5 rounded font-medium">
                    {person.entity_name}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-600 capitalize">{person.person_type?.replace('_', ' ')}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs px-2 py-0.5 rounded font-medium', REL_COLORS[person.distyl_relationship] || REL_COLORS.unknown)}>
                    {person.distyl_relationship}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {person.last_known_move ? formatDate(person.last_known_move) : '—'}
                </td>
                <td className="px-4 py-3">
                  {person.linkedin_url && (
                    <a href={person.linkedin_url} target="_blank" rel="noreferrer" className="text-primary-500 hover:text-primary-700">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {people.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <Users className="w-7 h-7 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No people tracked yet</p>
          </div>
        )}
      </div>

      {showAdd && <AddPersonModal onClose={() => setShowAdd(false)} />}
    </div>
  )
}
