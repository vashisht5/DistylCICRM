import { useState } from 'react'
import { UserCog, Plus, Search, X, Trash2, Edit2, Sparkles, DollarSign, Users, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  useStakeholderProfiles, useCreateStakeholderProfile,
  useUpdateStakeholderProfile, useDeleteStakeholderProfile, useParseStakeholderNotes
} from '@/lib/api'

const ROLE_OPTIONS = ['procurement','legal','champion','exec','finance','technical','board','user_buyer']
const DECISION_STYLE_OPTIONS = ['analytical','intuitive','consensus','directive','relational']
const RISK_OPTIONS = ['risk_averse','moderate','risk_tolerant']
const EGO_OPTIONS = ['low','medium','high']
const ORIENTATION_OPTIONS = ['transactional','relational']
const COMM_OPTIONS = ['direct','diplomatic','data_driven','political','emotional']
const MOTIVATION_OPTIONS = ['cost_reduction','risk_mitigation','career_advancement','innovation','compliance']
const INFLUENCE_OPTIONS = ['low','medium','high','key_decision_maker']
const TECH_DEPTH_OPTIONS = ['non_technical','moderate','deep_technical']
const CONCESSION_OPTIONS = ['never_first','reciprocal','random','strategic_early']

const ROLE_COLORS: Record<string, string> = {
  champion: 'bg-green-100 text-green-700',
  exec: 'bg-purple-100 text-purple-700',
  procurement: 'bg-orange-100 text-orange-700',
  legal: 'bg-red-100 text-red-700',
  finance: 'bg-blue-100 text-blue-700',
  technical: 'bg-cyan-100 text-cyan-700',
  board: 'bg-pink-100 text-pink-700',
  user_buyer: 'bg-gray-100 text-gray-700',
}

const INFLUENCE_COLORS: Record<string, string> = {
  key_decision_maker: 'bg-purple-100 text-purple-700',
  high: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-gray-100 text-gray-600',
}

type Profile = Record<string, any>

function ProfileCard({ profile, onEdit, onDelete }: { profile: Profile; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{profile.name}</h3>
          <div className="text-sm text-gray-500 truncate">{profile.title}</div>
          {profile.company && (
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <Building2 className="w-3 h-3" />
              {profile.company}
            </div>
          )}
        </div>
        <div className="flex gap-1 ml-2 shrink-0">
          <button onClick={onEdit} className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-600 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {profile.role && (
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide', ROLE_COLORS[profile.role] || 'bg-gray-100 text-gray-600')}>
            {profile.role.replace('_', ' ')}
          </span>
        )}
        {profile.influence_level && (
          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide', INFLUENCE_COLORS[profile.influence_level] || 'bg-gray-100 text-gray-600')}>
            {profile.influence_level.replace('_', ' ')}
          </span>
        )}
        {profile.decision_style && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
            {profile.decision_style}
          </span>
        )}
        {profile.risk_tolerance && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
            {profile.risk_tolerance.replace('_', ' ')}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-500">
        {profile.budget_authority_usd && (
          <div className="flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            ${(profile.budget_authority_usd / 1000).toFixed(0)}K
          </div>
        )}
        {profile.team_size && (
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {profile.team_size} reports
          </div>
        )}
        {profile.win_rate != null && (
          <div className={cn('ml-auto font-medium', profile.win_rate >= 0.5 ? 'text-green-600' : 'text-red-500')}>
            {Math.round(profile.win_rate * 100)}% win
          </div>
        )}
      </div>
    </div>
  )
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="w-full text-sm border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="">—</option>
        {options.map(o => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
      </select>
    </div>
  )
}

const emptyForm = () => ({
  name: '', title: '', company: '', department: '', role: '',
  reports_to_id: '', budget_authority_usd: '', owns_budget_for: '', team_size: '',
  decision_style: '', risk_tolerance: '', ego_level: '', orientation: '',
  communication_style: '', primary_motivation: '', influence_level: '',
  technical_depth: '', concession_pattern: '', typical_opening_position: '',
  raw_notes: '', attributes: [] as { key: string; value: string }[],
})

type FormData = ReturnType<typeof emptyForm>

function profileToForm(p: Profile): FormData {
  const attrs = p.attributes || {}
  return {
    name: p.name || '',
    title: p.title || '',
    company: p.company || '',
    department: p.department || '',
    role: p.role || '',
    reports_to_id: p.reports_to_id?.toString() || '',
    budget_authority_usd: p.budget_authority_usd?.toString() || '',
    owns_budget_for: p.owns_budget_for || '',
    team_size: p.team_size?.toString() || '',
    decision_style: p.decision_style || '',
    risk_tolerance: p.risk_tolerance || '',
    ego_level: p.ego_level || '',
    orientation: p.orientation || '',
    communication_style: p.communication_style || '',
    primary_motivation: p.primary_motivation || '',
    influence_level: p.influence_level || '',
    technical_depth: p.technical_depth || '',
    concession_pattern: p.concession_pattern || '',
    typical_opening_position: p.typical_opening_position || '',
    raw_notes: p.raw_notes || '',
    attributes: Object.entries(attrs).map(([key, value]) => ({ key, value: String(value) })),
  }
}

function formToPayload(f: FormData): Record<string, unknown> {
  const attrs: Record<string, string> = {}
  f.attributes.forEach(({ key, value }) => { if (key.trim()) attrs[key.trim()] = value })
  return {
    name: f.name,
    title: f.title || null,
    company: f.company || null,
    department: f.department || null,
    role: f.role || null,
    reports_to_id: f.reports_to_id ? parseInt(f.reports_to_id) : null,
    budget_authority_usd: f.budget_authority_usd ? parseInt(f.budget_authority_usd) : null,
    owns_budget_for: f.owns_budget_for || null,
    team_size: f.team_size ? parseInt(f.team_size) : null,
    decision_style: f.decision_style || null,
    risk_tolerance: f.risk_tolerance || null,
    ego_level: f.ego_level || null,
    orientation: f.orientation || null,
    communication_style: f.communication_style || null,
    primary_motivation: f.primary_motivation || null,
    influence_level: f.influence_level || null,
    technical_depth: f.technical_depth || null,
    concession_pattern: f.concession_pattern || null,
    typical_opening_position: f.typical_opening_position || null,
    raw_notes: f.raw_notes || null,
    attributes: attrs,
    auto_parse: false,
  }
}

export default function StakeholderLibrary() {
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Profile | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm())
  const [parsePreview, setParsePreview] = useState<any>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [section, setSection] = useState<'notes' | 'psych' | 'org' | 'attrs'>('notes')

  const { data: profiles = [], isLoading } = useStakeholderProfiles(search ? { q: search } : undefined)
  const createProfile = useCreateStakeholderProfile()
  const updateProfile = useUpdateStakeholderProfile()
  const deleteProfile = useDeleteStakeholderProfile()
  const parseNotes = useParseStakeholderNotes()

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
    setParsePreview(null)
    setSection('notes')
    setModalOpen(true)
  }

  function openEdit(p: Profile) {
    setEditing(p)
    setForm(profileToForm(p))
    setParsePreview(null)
    setSection('notes')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setParsePreview(null)
  }

  async function handleParse() {
    if (!form.raw_notes.trim()) return
    setIsParsing(true)
    try {
      const result = await parseNotes.mutateAsync({
        raw_notes: form.raw_notes,
        existing_fields: formToPayload(form),
      })
      setParsePreview(result)
      toast.success('Notes parsed successfully')
    } catch {
      toast.error('Parse failed')
    } finally {
      setIsParsing(false)
    }
  }

  function applyParsed() {
    if (!parsePreview) return
    const fu = parsePreview.field_updates || {}
    setForm(prev => ({
      ...prev,
      ...Object.fromEntries(
        Object.entries(fu)
          .filter(([k, v]) => v != null && k !== 'reports_to_name' && k in prev)
          .map(([k, v]) => [k, String(v)])
      ),
      attributes: [
        ...prev.attributes.filter(a => a.key && !parsePreview.attributes?.[a.key]),
        ...Object.entries(parsePreview.attributes || {}).map(([key, value]) => ({ key, value: String(value) })),
      ],
    }))
    setParsePreview(null)
    toast.success('Applied parsed fields')
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    const payload = formToPayload(form)
    try {
      if (editing) {
        await updateProfile.mutateAsync({ id: editing.id, data: payload })
        toast.success('Profile updated')
      } else {
        await createProfile.mutateAsync(payload)
        toast.success('Profile created')
      }
      closeModal()
    } catch {
      toast.error('Save failed')
    }
  }

  async function handleDelete(p: Profile) {
    if (!confirm(`Delete profile for ${p.name}?`)) return
    try {
      await deleteProfile.mutateAsync(p.id)
      toast.success('Deleted')
    } catch {
      toast.error('Delete failed')
    }
  }

  const setField = (k: string) => (v: string) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <UserCog className="w-6 h-6 text-primary-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Stakeholder Library</h1>
            <p className="text-sm text-gray-500">{(profiles as Profile[]).length} profiles</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Profile
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, company, or title..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (profiles as Profile[]).length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <UserCog className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No profiles yet. Create your first stakeholder profile.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(profiles as Profile[]).map((p: Profile) => (
            <ProfileCard key={p.id} profile={p} onEdit={() => openEdit(p)} onDelete={() => handleDelete(p)} />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Profile' : 'New Stakeholder Profile'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            {/* Section tabs */}
            <div className="flex border-b border-gray-200 px-6">
              {[
                { id: 'notes', label: 'Notes & Parse' },
                { id: 'psych', label: 'Psychology' },
                { id: 'org', label: 'Org & Budget' },
                { id: 'attrs', label: 'Attributes' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSection(tab.id as 'notes' | 'psych' | 'org' | 'attrs')}
                  className={cn(
                    'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                    section === tab.id ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {section === 'notes' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      value={form.name}
                      onChange={e => setField('name')(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Sarah Chen"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                      <input value={form.title} onChange={e => setField('title')(e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="VP Engineering" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                      <input value={form.company} onChange={e => setField('company')(e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Acme Corp" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Free-text Notes (AI-parsed)</label>
                    <textarea
                      value={form.raw_notes}
                      onChange={e => setField('raw_notes')(e.target.value)}
                      rows={5}
                      className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                      placeholder="Sarah Chen is VP Engineering at Acme. She reports to the CRO Tom Blake. Very analytical, always asks for 3 customer references. Budget authority up to $200K..."
                    />
                  </div>

                  <button
                    onClick={handleParse}
                    disabled={!form.raw_notes.trim() || isParsing}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isParsing ? 'Parsing...' : 'Parse Notes →'}
                  </button>

                  {parsePreview && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-indigo-800">Parse Preview</span>
                        <button onClick={applyParsed} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700">
                          Apply Fields
                        </button>
                      </div>
                      <div className="space-y-1 text-xs">
                        {Object.entries(parsePreview.field_updates || {}).filter(([, v]) => v != null).map(([k, v]) => (
                          <div key={k} className="flex gap-2">
                            <span className="text-indigo-600 font-medium w-36 shrink-0">{k.replace(/_/g, ' ')}:</span>
                            <span className="text-gray-800">{String(v)}</span>
                          </div>
                        ))}
                        {Object.entries(parsePreview.attributes || {}).map(([k, v]) => (
                          <div key={k} className="flex gap-2">
                            <span className="text-purple-600 font-medium w-36 shrink-0">[attr] {k}:</span>
                            <span className="text-gray-800">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {section === 'psych' && (
                <div className="grid grid-cols-2 gap-3">
                  <SelectField label="Role" value={form.role} options={ROLE_OPTIONS} onChange={setField('role')} />
                  <SelectField label="Decision Style" value={form.decision_style} options={DECISION_STYLE_OPTIONS} onChange={setField('decision_style')} />
                  <SelectField label="Risk Tolerance" value={form.risk_tolerance} options={RISK_OPTIONS} onChange={setField('risk_tolerance')} />
                  <SelectField label="Ego Level" value={form.ego_level} options={EGO_OPTIONS} onChange={setField('ego_level')} />
                  <SelectField label="Orientation" value={form.orientation} options={ORIENTATION_OPTIONS} onChange={setField('orientation')} />
                  <SelectField label="Communication Style" value={form.communication_style} options={COMM_OPTIONS} onChange={setField('communication_style')} />
                  <SelectField label="Primary Motivation" value={form.primary_motivation} options={MOTIVATION_OPTIONS} onChange={setField('primary_motivation')} />
                  <SelectField label="Influence Level" value={form.influence_level} options={INFLUENCE_OPTIONS} onChange={setField('influence_level')} />
                  <SelectField label="Technical Depth" value={form.technical_depth} options={TECH_DEPTH_OPTIONS} onChange={setField('technical_depth')} />
                  <SelectField label="Concession Pattern" value={form.concession_pattern} options={CONCESSION_OPTIONS} onChange={setField('concession_pattern')} />
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Typical Opening Position</label>
                    <textarea value={form.typical_opening_position} onChange={e => setField('typical_opening_position')(e.target.value)}
                      rows={2} className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                </div>
              )}

              {section === 'org' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Reports To (profile name)</label>
                    <select
                      value={form.reports_to_id}
                      onChange={e => setField('reports_to_id')(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">— none —</option>
                      {(profiles as Profile[]).filter((p: Profile) => p.id !== editing?.id).map((p: Profile) => (
                        <option key={p.id} value={p.id}>{p.name} {p.company ? `(${p.company})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Budget Authority (USD)</label>
                      <input type="number" value={form.budget_authority_usd} onChange={e => setField('budget_authority_usd')(e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="200000" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Team Size</label>
                      <input type="number" value={form.team_size} onChange={e => setField('team_size')(e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="12" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Owns Budget For</label>
                    <input value={form.owns_budget_for} onChange={e => setField('owns_budget_for')(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="IT infrastructure, SaaS tools" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                    <input value={form.department} onChange={e => setField('department')(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Engineering" />
                  </div>
                </div>
              )}

              {section === 'attrs' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-medium text-gray-700">Custom Attributes</label>
                    <button
                      onClick={() => setForm(prev => ({ ...prev, attributes: [...prev.attributes, { key: '', value: '' }] }))}
                      className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.attributes.map((attr, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          value={attr.key}
                          onChange={e => setForm(prev => ({ ...prev, attributes: prev.attributes.map((a, j) => j === i ? { ...a, key: e.target.value } : a) }))}
                          className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="key"
                        />
                        <input
                          value={attr.value}
                          onChange={e => setForm(prev => ({ ...prev, attributes: prev.attributes.map((a, j) => j === i ? { ...a, value: e.target.value } : a) }))}
                          className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="value"
                        />
                        <button
                          onClick={() => setForm(prev => ({ ...prev, attributes: prev.attributes.filter((_, j) => j !== i) }))}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {form.attributes.length === 0 && (
                      <p className="text-xs text-gray-400">No custom attributes yet. Add key-value pairs for anything extra.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button
                onClick={handleSave}
                disabled={createProfile.isPending || updateProfile.isPending}
                className="px-6 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {editing ? 'Save Changes' : 'Create Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
