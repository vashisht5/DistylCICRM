import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Sparkles, RefreshCw, Plus, Target, Users, Swords } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useDeals, useDealIntel, useUpdateDealIntel, useParseDealNotes, useStakeholderProfiles, useWargames } from '@/lib/api'

const STAGE_OPTIONS = ['discovery','qualification','technical_eval','pricing','negotiation','close']

export default function PreSalesDeal() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dealId = id ? parseInt(id) : null

  const [tab, setTab] = useState<'overview' | 'meddic' | 'stakeholders' | 'wargames'>('overview')
  const [rawNotes, setRawNotes] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parsePreview, setParsePreview] = useState<any>(null)

  const { data: deals = [] } = useDeals()
  const deal = (deals as any[]).find((d: any) => d.id === dealId)
  const { data: intel, isLoading } = useDealIntel(dealId)
  const { data: profiles = [] } = useStakeholderProfiles()
  const { data: wargames = [] } = useWargames()
  const updateIntel = useUpdateDealIntel()
  const parseDealNotes = useParseDealNotes()

  const dealWargames = (wargames as any[]).filter((g: any) => g.deal_id === dealId)

  async function handleParse() {
    if (!rawNotes.trim() || !dealId) return
    setIsParsing(true)
    try {
      const result = await parseDealNotes.mutateAsync({
        dealId,
        data: { raw_notes: rawNotes, existing_fields: intel || {} },
      })
      setParsePreview(result)
      toast.success('Notes parsed')
    } catch {
      toast.error('Parse failed')
    } finally {
      setIsParsing(false)
    }
  }

  async function applyAndSave() {
    if (!parsePreview || !dealId) return
    const fu = parsePreview.field_updates || {}
    const payload: Record<string, unknown> = { ...fu }
    if (parsePreview.key_risks) payload.key_risks = parsePreview.key_risks
    if (parsePreview.next_steps) payload.next_steps = parsePreview.next_steps
    if (parsePreview.attributes) {
      payload.attributes = { ...(intel?.attributes || {}), ...parsePreview.attributes }
    }
    if (fu.economic_buyer_profile_id) payload.economic_buyer_profile_id = fu.economic_buyer_profile_id
    if (fu.champion_profile_id) payload.champion_profile_id = fu.champion_profile_id

    try {
      await updateIntel.mutateAsync({ dealId, data: payload })
      setParsePreview(null)
      setRawNotes('')
      toast.success('Deal intel updated')
    } catch {
      toast.error('Failed to save')
    }
  }

  async function handleFieldUpdate(field: string, value: unknown) {
    if (!dealId) return
    try {
      await updateIntel.mutateAsync({ dealId, data: { [field]: value } })
    } catch {
      toast.error('Failed to save')
    }
  }

  const champProfile = (profiles as any[]).find((p: any) => p.id === intel?.champion_profile_id)
  const ebProfile = (profiles as any[]).find((p: any) => p.id === intel?.economic_buyer_profile_id)
  const stakeholderMap: any[] = intel?.stakeholder_map || []

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <button onClick={() => navigate('/pipeline')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-2">
          <ChevronLeft className="w-4 h-4" /> Pipeline
        </button>
        <h1 className="text-xl font-bold text-gray-900">{deal?.account_name || `Deal ${dealId}`}</h1>
        <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
          {deal?.deal_name && <span>{deal.deal_name}</span>}
          {deal?.stage && <span className="capitalize">{deal.stage}</span>}
          {deal?.value_usd && <span>${deal.value_usd.toLocaleString()}</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-6 shrink-0">
        {[
          { id: 'overview', label: 'Overview', icon: Target },
          { id: 'meddic', label: 'MEDDIC', icon: null },
          { id: 'stakeholders', label: 'Stakeholder Map', icon: Users },
          { id: 'wargames', label: `Wargames (${dealWargames.length})`, icon: Swords },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as 'overview' | 'meddic' | 'stakeholders' | 'wargames')}
            className={cn('flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.id ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            )}>
            {t.icon && <t.icon className="w-4 h-4" />}
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
        ) : (
          <>
            {/* Notes parse panel */}
            <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-semibold text-indigo-800">AI Notes Parser</span>
              </div>
              <textarea
                value={rawNotes}
                onChange={e => setRawNotes(e.target.value)}
                rows={3}
                className="w-full text-sm border border-indigo-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Type or paste deal notes here... e.g. Budget is $400K for Q2. Sarah is champion. CRO Tom Blake is economic buyer."
              />
              <div className="flex items-center gap-3 mt-2">
                <button onClick={handleParse} disabled={!rawNotes.trim() || isParsing}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {isParsing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Parse
                </button>
                {parsePreview && (
                  <button onClick={applyAndSave} disabled={updateIntel.isPending}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700">
                    Apply & Save
                  </button>
                )}
              </div>
              {parsePreview && (
                <div className="mt-3 bg-white rounded-lg p-3 border border-indigo-200">
                  <div className="text-xs font-semibold text-indigo-700 mb-2">Parsed Fields</div>
                  <div className="space-y-1 text-xs">
                    {Object.entries(parsePreview.field_updates || {}).filter(([, v]) => v != null).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <span className="text-indigo-600 font-medium w-40 shrink-0">{k.replace(/_/g, ' ')}:</span>
                        <span className="text-gray-700">{Array.isArray(v) ? v.join(', ') : String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {tab === 'overview' && (
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-800 mb-3">Presales Stage</h3>
                  <select value={intel?.presales_stage || 'discovery'}
                    onChange={e => handleFieldUpdate('presales_stage', e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {STAGE_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-800 mb-3">Key Profiles</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-32 shrink-0">Champion:</span>
                      <span className="font-medium text-gray-800">{champProfile?.name || intel?.champion_notes || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-32 shrink-0">Economic Buyer:</span>
                      <span className="font-medium text-gray-800">{ebProfile?.name || intel?.economic_buyer_notes || '—'}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-5 col-span-2">
                  <h3 className="font-semibold text-gray-800 mb-3">Next Steps</h3>
                  <div className="space-y-1">
                    {(intel?.next_steps || []).map((step: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-primary-500 mt-0.5">→</span>{step}
                      </div>
                    ))}
                    {(!intel?.next_steps || intel.next_steps.length === 0) && (
                      <p className="text-sm text-gray-400">No next steps yet. Parse notes or edit MEDDIC.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {tab === 'meddic' && (
              <div className="space-y-4 max-w-2xl">
                {[
                  { key: 'metrics', label: 'Metrics', hint: 'Measurable success criteria' },
                  { key: 'identified_pain', label: 'Identified Pain', hint: 'Explicit pain points discovered' },
                  { key: 'decision_process', label: 'Decision Process', hint: 'How they will decide' },
                  { key: 'seller_batna', label: 'Our BATNA', hint: 'Our best alternative to no deal' },
                  { key: 'buyer_batna_estimate', label: 'Their BATNA (estimate)', hint: 'Their best alternative' },
                ].map(({ key, label, hint }) => (
                  <div key={key} className="bg-white rounded-xl border border-gray-200 p-5">
                    <label className="block text-sm font-semibold text-gray-800 mb-1">{label}</label>
                    <p className="text-xs text-gray-400 mb-2">{hint}</p>
                    <textarea
                      defaultValue={intel?.[key] || ''}
                      onBlur={e => { if (e.target.value !== (intel?.[key] || '')) handleFieldUpdate(key, e.target.value) }}
                      rows={3}
                      className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                ))}

                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Decision Criteria</label>
                  <div className="space-y-1 mb-2">
                    {(intel?.decision_criteria || []).map((c: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="w-4 h-4 rounded-full bg-primary-100 text-primary-700 text-[10px] flex items-center justify-center font-bold">{i+1}</span>
                        {c}
                      </div>
                    ))}
                    {(!intel?.decision_criteria || intel.decision_criteria.length === 0) && (
                      <p className="text-sm text-gray-400">No criteria yet. Parse notes to extract.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Champion</label>
                    <select value={intel?.champion_profile_id || ''}
                      onChange={e => handleFieldUpdate('champion_profile_id', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full text-sm border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">— select —</option>
                      {(profiles as any[]).map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.company || 'unknown'})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Economic Buyer</label>
                    <select value={intel?.economic_buyer_profile_id || ''}
                      onChange={e => handleFieldUpdate('economic_buyer_profile_id', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full text-sm border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">— select —</option>
                      {(profiles as any[]).map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.company || 'unknown'})</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {tab === 'stakeholders' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Stakeholder Map</h3>
                  <button onClick={() => navigate('/stakeholders')} className="text-sm text-primary-600 hover:text-primary-800">
                    Manage Profiles →
                  </button>
                </div>
                {stakeholderMap.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No stakeholders mapped yet. Parse notes with stakeholder names or add them manually.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stakeholderMap.map((s: any, i: number) => {
                      const profile = (profiles as any[]).find((p: any) => p.id === s.profile_id)
                      return (
                        <div key={i} className={cn('bg-white rounded-xl border p-4',
                          s.stance === 'champion' ? 'border-green-300' :
                          s.stance === 'blocker' ? 'border-red-300' : 'border-gray-200'
                        )}>
                          <div className="font-semibold text-gray-900">{profile?.name || `Profile ${s.profile_id}`}</div>
                          <div className="text-xs text-gray-500">{profile?.title} · {profile?.company}</div>
                          <div className="flex gap-2 mt-2">
                            <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase',
                              s.stance === 'champion' ? 'bg-green-100 text-green-700' :
                              s.stance === 'blocker' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-600'
                            )}>
                              {s.stance}
                            </span>
                            {s.influence && <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded uppercase">{s.influence}</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {tab === 'wargames' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Wargames for this Deal</h3>
                  <button onClick={() => navigate('/wargame')} className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-800">
                    <Plus className="w-4 h-4" /> New Game
                  </button>
                </div>
                {dealWargames.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Swords className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No wargames for this deal yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dealWargames.map((g: any) => (
                      <div key={g.id}
                        className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => navigate('/wargame')}>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{g.name}</div>
                          <div className="text-xs text-gray-500">{g.presales_stage} · {g.scenario_type?.replace(/_/g, ' ')}</div>
                        </div>
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded uppercase',
                          g.status === 'completed' && g.outcome === 'won' ? 'bg-green-100 text-green-700' :
                          g.status === 'completed' && g.outcome === 'lost' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        )}>
                          {g.outcome || g.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
