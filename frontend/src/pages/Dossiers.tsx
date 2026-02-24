import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FileText, Loader2, RefreshCw, Flag, ChevronRight, Sparkles, ExternalLink } from 'lucide-react'
import {
  useEntities, useDossiers, useDossier, useGenerateDossier,
  useCeoBrief, useRegenerateCeoBrief, useFlagHallucination
} from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'
import { toast } from 'sonner'

const SECTIONS = [
  { key: 'a', label: 'A — Synopsis' },
  { key: 'b', label: 'B — Products' },
  { key: 'c', label: 'C — Clients' },
  { key: 'd', label: 'D — GTM' },
  { key: 'e', label: 'E — Competitive' },
  { key: 'f', label: 'F — Funding' },
  { key: 'g', label: 'G — Talent' },
  { key: 'h', label: 'H — Tech' },
  { key: 'i', label: 'I — Regulatory' },
  { key: 'j', label: 'J — SWOT' },
  { key: 'k', label: 'K — Battle Brief' },
  { key: 'l', label: 'L — Sources' },
  { key: 'ceo', label: '★ CEO Brief' },
]

function ConfidenceBadge({ level }: { level?: string }) {
  if (!level) return null
  const colors: Record<string, string> = {
    High: 'bg-green-100 text-green-700 border-green-200',
    Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Low: 'bg-red-100 text-red-700 border-red-200',
  }
  return (
    <span className={cn('text-xs px-1.5 py-0.5 rounded border font-medium', colors[level] || colors.Low)}>
      {level} confidence
    </span>
  )
}

function DossierSection({ dossier, sectionKey, entityName }: { dossier: any; sectionKey: string; entityName: string }) {
  const flagHallucination = useFlagHallucination()
  const sectionField = `section_${sectionKey}_`
  const entry = Object.entries(dossier).find(([k]) => k.startsWith(sectionField))
  const content = entry?.[1] as string | undefined

  if (!content) return (
    <div className="text-sm text-gray-400 italic p-4">Section not yet generated.</div>
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ConfidenceBadge level={dossier.overall_confidence} />
      </div>
      <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">{content}</div>
      <button
        onClick={() => {
          const claim = window.prompt('Enter the specific claim to flag:')
          if (claim) {
            flagHallucination.mutate({ dossierId: dossier.id, section: sectionKey, claim }, {
              onSuccess: () => toast.success('Claim flagged for review'),
            })
          }
        }}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
      >
        <Flag className="w-3 h-3" /> Flag hallucination
      </button>
    </div>
  )
}

function CeoBriefSection({ dossierId }: { dossierId: number }) {
  const { data, isLoading } = useCeoBrief(dossierId)
  const regenerate = useRegenerateCeoBrief()

  if (isLoading) return <div className="flex items-center gap-2 p-4 text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading CEO brief...</div>

  const brief = data?.brief

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary-500" />
          <span className="text-sm font-medium text-gray-700">CEO 1-Page Brief</span>
          {brief?.brief_date && <span className="text-xs text-gray-400">{formatDate(brief.brief_date)}</span>}
        </div>
        <button
          onClick={() => regenerate.mutate(dossierId, { onSuccess: () => toast.success('CEO brief regenerating...') })}
          disabled={regenerate.isPending}
          className="flex items-center gap-1.5 text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
        >
          <RefreshCw className={cn('w-3 h-3', regenerate.isPending && 'animate-spin')} />
          Regenerate
        </button>
      </div>

      {!brief ? (
        <div className="text-sm text-gray-400 italic">CEO brief not yet generated. It will be auto-generated on first view.</div>
      ) : (
        <div className="space-y-4">
          {brief.sections && Object.entries(brief.sections).map(([num, section]: [string, any]) => (
            <div key={num} className="border border-gray-100 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">{section.title}</h3>
              {typeof section.content === 'string' ? (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{section.content}</p>
              ) : Array.isArray(section.content) ? (
                <ul className="space-y-1">
                  {section.content.map((item: any, i: number) => (
                    <li key={i} className="text-sm text-gray-600">
                      {typeof item === 'string' ? `• ${item}` : (
                        <div>
                          <span className="font-medium text-gray-800">{item.motion || item.center || item.step}</span>
                          {item.confidence && <span className="ml-2 text-xs text-green-600">({item.confidence} confidence)</span>}
                          {item.why_now && <p className="text-xs text-gray-500 mt-0.5">{item.why_now}</p>}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
          {brief.overall_confidence && (
            <ConfidenceBadge level={brief.overall_confidence} />
          )}
        </div>
      )}
    </div>
  )
}

export default function Dossiers() {
  const { id: paramId } = useParams()
  const navigate = useNavigate()
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(paramId ? parseInt(paramId) : null)
  const [activeSection, setActiveSection] = useState('a')
  const [generatingId, setGeneratingId] = useState<number | null>(null)

  const { data: entitiesData } = useEntities()
  const { data: dossiersData } = useDossiers(selectedEntityId ?? undefined)
  const latestDossier = dossiersData?.dossiers?.[0]
  const { data: dossierData } = useDossier(latestDossier?.id ?? null)
  const generateDossier = useGenerateDossier()

  const entities = entitiesData?.entities ?? []
  const selectedEntity = entities.find((e: any) => e.id === selectedEntityId)

  async function handleGenerate() {
    if (!selectedEntityId) return
    try {
      setGeneratingId(selectedEntityId)
      await generateDossier.mutateAsync(selectedEntityId)
      toast.success('Dossier generation started — this takes 1-2 minutes')
    } catch {
      toast.error('Failed to start generation')
    } finally {
      setGeneratingId(null)
    }
  }

  const dossier = dossierData ?? latestDossier

  return (
    <div className="flex h-full">
      {/* Entity list sidebar */}
      <div className="w-56 border-r border-gray-200 bg-white flex flex-col shrink-0">
        <div className="p-3 border-b border-gray-100">
          <h1 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-primary-600" /> Dossiers
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {entities.map((entity: any) => (
            <button
              key={entity.id}
              onClick={() => { setSelectedEntityId(entity.id); navigate(`/dossiers/${entity.id}`) }}
              className={cn(
                'w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between',
                selectedEntityId === entity.id
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              <span className="truncate">{entity.name}</span>
              <ChevronRight className={cn('w-3.5 h-3.5 shrink-0', selectedEntityId === entity.id ? 'text-primary-400' : 'text-gray-300')} />
            </button>
          ))}
        </div>
      </div>

      {/* Dossier content */}
      <div className="flex-1 overflow-y-auto">
        {!selectedEntityId ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Select an entity to view its dossier</p>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedEntity?.name}</h2>
                {dossier && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    Generated {formatDate(dossier.generated_at)} ·{' '}
                    <ConfidenceBadge level={dossier.overall_confidence} />
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {dossier?.generation_status === 'in_progress' && (
                  <div className="flex items-center gap-1.5 text-sm text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
                  </div>
                )}
                <button
                  onClick={handleGenerate}
                  disabled={generateDossier.isPending || generatingId === selectedEntityId || dossier?.generation_status === 'in_progress'}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {(generateDossier.isPending || generatingId === selectedEntityId) ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  {dossier ? 'Regenerate' : 'Generate Dossier'}
                </button>
              </div>
            </div>

            {dossier && dossier.generation_status === 'completed' ? (
              <div className="flex gap-4">
                {/* Section tabs */}
                <div className="w-36 shrink-0">
                  <div className="space-y-0.5">
                    {SECTIONS.map(s => (
                      <button
                        key={s.key}
                        onClick={() => setActiveSection(s.key)}
                        className={cn(
                          'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                          activeSection === s.key
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-600 hover:bg-gray-50'
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section content */}
                <div className="flex-1 bg-white rounded-xl border border-gray-200 p-5">
                  {activeSection === 'ceo' ? (
                    <CeoBriefSection dossierId={dossier.id} />
                  ) : (
                    <DossierSection dossier={dossier} sectionKey={activeSection} entityName={selectedEntity?.name ?? ''} />
                  )}
                </div>
              </div>
            ) : !dossier ? (
              <div className="text-center py-16 text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm mb-3">No dossier generated yet</p>
                <button
                  onClick={handleGenerate}
                  className="text-sm px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Generate Now (1-2 min)
                </button>
              </div>
            ) : dossier.generation_status === 'in_progress' || dossier.generation_status === 'pending' ? (
              <div className="text-center py-16 text-gray-400">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary-400" />
                <p className="text-sm">Generating dossier — this takes 1-2 minutes...</p>
                <p className="text-xs mt-1 text-gray-300">Page will auto-update when complete</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
