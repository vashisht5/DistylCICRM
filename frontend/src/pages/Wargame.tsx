import { useState } from 'react'
import { Swords, Plus, X, Play, Square, Zap, BarChart2, ChevronRight, RefreshCw, Target, GitBranch, CheckCircle2, XCircle, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  useWargames, useWargame, useCreateWargame, useStartWargame,
  useSubmitTurn, useToggleAutoRun, useInjectScenario,
  useWargameAnalysis, useRunMonteCarlo,
  useSimulatePaths, useSimulationPaths, usePathMonteCarlo,
  useStakeholderProfiles, useDeals,
} from '@/lib/api'

const STAGES = ['discovery','qualification','technical_eval','pricing','negotiation','close']
const SCENARIOS = ['standard','competitive_displacement','budget_freeze','champion_lost','renewal','time_pressure']
const ACTION_TYPES = ['offer','counter_offer','concession','information_request','escalation','close','walkaway_signal']

const STATUS_COLORS: Record<string, string> = {
  setup: 'bg-gray-100 text-gray-600',
  active: 'bg-green-100 text-green-700',
  processing_turn: 'bg-yellow-100 text-yellow-700',
  auto_running: 'bg-blue-100 text-blue-700',
  completed: 'bg-purple-100 text-purple-700',
  archived: 'bg-gray-100 text-gray-500',
}

const ACTION_COLORS: Record<string, string> = {
  offer: 'bg-blue-100 text-blue-700',
  counter_offer: 'bg-orange-100 text-orange-700',
  concession: 'bg-green-100 text-green-700',
  escalation: 'bg-red-100 text-red-700',
  information_request: 'bg-cyan-100 text-cyan-700',
  walkaway_signal: 'bg-red-200 text-red-800',
  close: 'bg-purple-100 text-purple-700',
  intelligence_briefing: 'bg-indigo-100 text-indigo-700',
  adjudication: 'bg-gray-100 text-gray-600',
  scenario_inject: 'bg-amber-100 text-amber-700',
}

type WargameData = Record<string, any>

export default function WargamePage() {
  const [activeGameId, setActiveGameId] = useState<number | null>(null)
  const [view, setView] = useState<'list' | 'game' | 'analysis' | 'paths'>('list')
  const [createOpen, setCreateOpen] = useState(false)
  const [injectOpen, setInjectOpen] = useState(false)
  const [mcOpen, setMcOpen] = useState(false)
  const [simOpen, setSimOpen] = useState(false)
  const [simNPaths, setSimNPaths] = useState('4')
  const [activePath, setActivePath] = useState<number>(0)
  const [pathMcOpen, setPathMcOpen] = useState(false)
  const [pathMcRound, setPathMcRound] = useState<number | null>(null)
  const [pathMcRuns, setPathMcRuns] = useState('500')

  const { data: games = [], isLoading } = useWargames()
  const { data: game, isLoading: gameLoading } = useWargame(view !== 'list' ? activeGameId : null)
  const { data: _analysis } = useWargameAnalysis(view === 'analysis' ? activeGameId : null)
  const { data: simData } = useSimulationPaths(view !== 'list' ? activeGameId : null)
  const { data: profiles = [] } = useStakeholderProfiles()
  const { data: deals = [] } = useDeals()

  const createGame = useCreateWargame()
  const startGame = useStartWargame()
  const submitTurn = useSubmitTurn()
  const toggleAutoRun = useToggleAutoRun()
  const injectScenario = useInjectScenario()
  const runMC = useRunMonteCarlo()
  const simulatePaths = useSimulatePaths()
  const pathMC = usePathMonteCarlo()

  const [createForm, setCreateForm] = useState({
    name: '', presales_stage: 'negotiation', scenario_type: 'standard',
    deal_id: '', max_rounds: '10',
    participants: [] as { profile_id: string; team: string; opening_notes: string }[],
  })

  const [turnForm, setTurnForm] = useState({ action_type: 'offer', message: '', terms: '' })
  const [injectForm, setInjectForm] = useState({ scenario: '', description: '' })
  const [mcRuns, setMcRuns] = useState('500')
  const [autoStrategy, setAutoStrategy] = useState('Win at best available terms')

  const DEFAULT_MC_CONFIG = {
    win_threshold: 68, kdm_win_min: 55, loss_threshold: 22, min_close_round: 3,
    event_probs: { competitor_enters: 0.07, budget_concern: 0.06, champion_boost: 0.10, exec_pressure: 0.05 },
    event_competitor_enters_enabled: true, event_budget_concern_enabled: true,
    event_champion_boost_enabled: true, event_exec_pressure_enabled: true,
    action_weights: null as null | Record<string, number>,
    strategy_preset: 'auto',
  }
  const [mcConfig, setMcConfig] = useState({ ...DEFAULT_MC_CONFIG })
  const [showMcAdvanced, setShowMcAdvanced] = useState(false)

  function openGame(g: WargameData) {
    setActiveGameId(g.id)
    setView('game')
  }

  async function handleCreate() {
    if (!createForm.name.trim()) { toast.error('Name required'); return }
    try {
      const payload = {
        name: createForm.name,
        presales_stage: createForm.presales_stage,
        scenario_type: createForm.scenario_type,
        deal_id: createForm.deal_id ? parseInt(createForm.deal_id) : null,
        max_rounds: parseInt(createForm.max_rounds) || 10,
        participants: createForm.participants
          .filter(p => p.profile_id)
          .map(p => ({ profile_id: parseInt(p.profile_id), team: p.team, opening_notes: p.opening_notes })),
      }
      const result = await createGame.mutateAsync(payload)
      setCreateOpen(false)
      setCreateForm({ name: '', presales_stage: 'negotiation', scenario_type: 'standard', deal_id: '', max_rounds: '10', participants: [] })
      openGame(result)
      toast.success('Game created')
    } catch {
      toast.error('Failed to create game')
    }
  }

  async function handleStart() {
    if (!activeGameId) return
    try {
      await startGame.mutateAsync(activeGameId)
      toast.success('Game started')
    } catch {
      toast.error('Failed to start')
    }
  }

  async function handleSubmitTurn() {
    if (!activeGameId || !turnForm.message.trim()) { toast.error('Enter your move'); return }
    try {
      const move: Record<string, unknown> = {
        action_type: turnForm.action_type,
        message: turnForm.message,
      }
      if (turnForm.terms.trim()) {
        try { move.terms_proposed = JSON.parse(turnForm.terms) } catch { move.terms_proposed = { note: turnForm.terms } }
      }
      await submitTurn.mutateAsync({ id: activeGameId, move })
      setTurnForm(prev => ({ ...prev, message: '', terms: '' }))
      toast.success('Turn submitted')
    } catch {
      toast.error('Failed to submit turn')
    }
  }

  async function handleAutoRun(enable: boolean) {
    if (!activeGameId) return
    try {
      await toggleAutoRun.mutateAsync({ id: activeGameId, enabled: enable, seller_strategy: autoStrategy })
      toast.success(enable ? 'Auto-run started' : 'Auto-run stopped')
    } catch {
      toast.error('Failed')
    }
  }

  async function handleInject() {
    if (!activeGameId || !injectForm.scenario.trim()) return
    try {
      await injectScenario.mutateAsync({ id: activeGameId, ...injectForm })
      setInjectOpen(false)
      setInjectForm({ scenario: '', description: '' })
      toast.success('Scenario injected')
    } catch {
      toast.error('Failed to inject')
    }
  }

  function buildMcConfig() {
    const cfg: Record<string, unknown> = {
      win_threshold: mcConfig.win_threshold,
      kdm_win_min: mcConfig.kdm_win_min,
      loss_threshold: mcConfig.loss_threshold,
      min_close_round: mcConfig.min_close_round,
      event_probs: mcConfig.event_probs,
      event_competitor_enters_enabled: mcConfig.event_competitor_enters_enabled,
      event_budget_concern_enabled: mcConfig.event_budget_concern_enabled,
      event_champion_boost_enabled: mcConfig.event_champion_boost_enabled,
      event_exec_pressure_enabled: mcConfig.event_exec_pressure_enabled,
    }
    if (mcConfig.strategy_preset === 'custom' && mcConfig.action_weights) {
      cfg.action_weights = mcConfig.action_weights
    }
    return cfg
  }

  async function handleMonteCarlo() {
    if (!activeGameId) return
    try {
      await runMC.mutateAsync({ id: activeGameId, n_runs: parseInt(mcRuns) || 500, config: buildMcConfig() })
      toast.success('Monte Carlo started')
      setMcOpen(false)
    } catch {
      toast.error('Failed to start Monte Carlo')
    }
  }

  async function handlePathMonteCarlo() {
    if (!activeGameId) return
    const path = simData?.simulation_paths?.[activePath]
    const rounds = (path?.turns || []).map((t: any) => t.round || 0)
    const maxRound = rounds.length ? Math.max(...rounds) : 3
    const fromRound = pathMcRound ?? maxRound
    try {
      await pathMC.mutateAsync({ id: activeGameId, path_index: activePath, from_round: fromRound, n_runs: parseInt(pathMcRuns) || 500, config: buildMcConfig() })
      setPathMcOpen(false)
      toast.success(`Monte Carlo running from round ${fromRound}...`)
    } catch {
      toast.error('Failed to start Monte Carlo')
    }
  }

  async function handleSimulatePaths() {
    if (!activeGameId) return
    try {
      await simulatePaths.mutateAsync({ id: activeGameId, n_paths: parseInt(simNPaths) || 4 })
      setSimOpen(false)
      setView('paths')
      setActivePath(0)
      toast.success('Simulation started — generating paths...')
    } catch {
      toast.error('Failed to start simulation')
    }
  }

  if (view === 'list') {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Swords className="w-6 h-6 text-primary-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Pre-Sales Wargame</h1>
              <p className="text-sm text-gray-500">AI-driven negotiation simulation</p>
            </div>
          </div>
          <button onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">
            <Plus className="w-4 h-4" /> New Game
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
        ) : (games as WargameData[]).length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Swords className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No wargames yet. Start a simulation to practice your negotiation.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stage</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Scenario</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Round</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Outcome</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(games as WargameData[]).map((g: WargameData) => (
                  <tr key={g.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openGame(g)}>
                    <td className="px-4 py-3 font-medium text-gray-900">{g.name}</td>
                    <td className="px-4 py-3 text-gray-600">{g.presales_stage}</td>
                    <td className="px-4 py-3 text-gray-500">{g.scenario_type?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded uppercase', STATUS_COLORS[g.status] || 'bg-gray-100 text-gray-600')}>
                        {g.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{g.current_round}/{g.max_rounds}</td>
                    <td className="px-4 py-3">
                      {g.outcome && <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded uppercase',
                        g.outcome === 'won' ? 'bg-green-100 text-green-700' : g.outcome === 'lost' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                      )}>{g.outcome}</span>}
                    </td>
                    <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-gray-400" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Modal */}
        {createOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">New Wargame</h2>
                <button onClick={() => setCreateOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                  <input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Acme Corp Q2 Negotiation Sim" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Stage</label>
                    <select value={createForm.presales_stage} onChange={e => setCreateForm(f => ({ ...f, presales_stage: e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500">
                      {STAGES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Scenario</label>
                    <select value={createForm.scenario_type} onChange={e => setCreateForm(f => ({ ...f, scenario_type: e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500">
                      {SCENARIOS.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Max Rounds</label>
                    <input type="number" value={createForm.max_rounds} onChange={e => setCreateForm(f => ({ ...f, max_rounds: e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Linked Deal</label>
                    <select value={createForm.deal_id} onChange={e => setCreateForm(f => ({ ...f, deal_id: e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">— none —</option>
                      {(deals as any[]).map((d: any) => <option key={d.id} value={d.id}>{d.account_name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-700">Buyer Participants</label>
                    <button onClick={() => setCreateForm(f => ({ ...f, participants: [...f.participants, { profile_id: '', team: 'buyer', opening_notes: '' }] }))}
                      className="text-xs text-primary-600 hover:text-primary-800 font-medium">+ Add Buyer</button>
                  </div>
                  {createForm.participants.map((p, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <select value={p.profile_id} onChange={e => setCreateForm(f => ({ ...f, participants: f.participants.map((pp, j) => j === i ? { ...pp, profile_id: e.target.value } : pp) }))}
                        className="flex-1 text-sm border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="">Select profile</option>
                        {(profiles as any[]).map((pr: any) => <option key={pr.id} value={pr.id}>{pr.name} ({pr.company || 'unknown'})</option>)}
                      </select>
                      <button onClick={() => setCreateForm(f => ({ ...f, participants: f.participants.filter((_, j) => j !== i) }))}
                        className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t">
                <button onClick={() => setCreateOpen(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
                <button onClick={handleCreate} disabled={createGame.isPending}
                  className="px-6 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50">
                  Create Game
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const isAutoRunning = game?.status === 'auto_running'
  const isProcessing = game?.status === 'processing_turn'
  const isActive = game?.status === 'active'
  const isSetup = game?.status === 'setup'
  const isCompleted = game?.status === 'completed'

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        <button onClick={() => setView('list')} className="text-gray-400 hover:text-gray-600 text-sm">← Games</button>
        <span className="text-gray-300">/</span>
        <h2 className="font-semibold text-gray-900">{game?.name || 'Loading...'}</h2>
        {view === 'paths' && (
          <>
            <span className="text-gray-300">/</span>
            <span className="text-indigo-600 text-sm font-medium flex items-center gap-1"><GitBranch className="w-3.5 h-3.5" /> Simulation Paths</span>
            <button onClick={() => setView('game')} className="text-xs text-gray-400 hover:text-gray-600 underline">← Back to game</button>
          </>
        )}
        {game?.status && (
          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded uppercase', STATUS_COLORS[game.status] || '')}>
            {game.status.replace(/_/g, ' ')}
          </span>
        )}
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {isSetup && (
            <button onClick={handleStart} disabled={startGame.isPending}
              className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-green-700">
              <Play className="w-3.5 h-3.5" /> Start
            </button>
          )}
          {isActive && !isAutoRunning && (
            <>
              <button onClick={() => setInjectOpen(true)}
                className="flex items-center gap-1.5 border border-amber-300 text-amber-700 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-amber-50">
                <Zap className="w-3.5 h-3.5" /> Inject
              </button>
              <button onClick={() => handleAutoRun(true)}
                className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-blue-700">
                <Play className="w-3.5 h-3.5" /> Auto-Run
              </button>
            </>
          )}
          {isAutoRunning && (
            <button onClick={() => handleAutoRun(false)}
              className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-red-700 animate-pulse">
              <Square className="w-3.5 h-3.5" /> Stop
            </button>
          )}
          {(isActive || isCompleted) && (
            <button onClick={() => setMcOpen(true)}
              className="flex items-center gap-1.5 border border-gray-300 text-gray-600 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-gray-50">
              <BarChart2 className="w-3.5 h-3.5" /> Monte Carlo
            </button>
          )}
          <button onClick={() => setSimOpen(true)}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium',
              simData?.simulation_status === 'running'
                ? 'bg-indigo-100 text-indigo-600 animate-pulse'
                : 'border border-indigo-300 text-indigo-700 hover:bg-indigo-50'
            )}>
            {simData?.simulation_status === 'running'
              ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Simulating...</>
              : <><GitBranch className="w-3.5 h-3.5" /> Sim Paths</>}
          </button>
          {simData?.simulation_paths?.length > 0 && (
            <button onClick={() => { setView('paths'); setActivePath(0) }}
              className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-indigo-700">
              <GitBranch className="w-3.5 h-3.5" /> View Paths ({simData.simulation_paths.length})
            </button>
          )}
          {isCompleted && (
            <button onClick={() => setView('analysis')}
              className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-purple-700">
              <Target className="w-3.5 h-3.5" /> Analysis
            </button>
          )}
        </div>
      </div>

      {/* ── Simulation Paths View ── */}
      {view === 'paths' && (
        <div className="flex-1 overflow-hidden flex flex-col">
          {simData?.simulation_status === 'running' ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-indigo-600">
              <RefreshCw className="w-10 h-10 animate-spin" />
              <div className="text-sm font-medium">AI is generating simulation paths...</div>
              <div className="text-xs text-gray-400">This may take 30–60 seconds</div>
            </div>
          ) : !simData?.simulation_paths?.length ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400">
              <GitBranch className="w-10 h-10 opacity-30" />
              <div className="text-sm">No simulation paths yet. Click "Sim Paths" to generate them.</div>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden">
              {/* Path Selector Sidebar */}
              <div className="w-56 border-r border-gray-200 bg-gray-50 flex flex-col overflow-y-auto">
                <div className="px-4 py-2.5 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {simData.simulation_paths.length} Paths
                </div>
                <div className="flex-1 p-2 space-y-1">
                  {simData.simulation_paths.map((path: any, i: number) => {
                    const isWin = path.outcome === 'won'
                    const isLost = path.outcome === 'lost'
                    return (
                      <button key={i} onClick={() => setActivePath(i)}
                        className={cn('w-full text-left rounded-lg px-3 py-2.5 transition-colors',
                          activePath === i ? 'bg-white border border-indigo-300 shadow-sm' : 'hover:bg-white/60'
                        )}>
                        <div className="flex items-center gap-1.5 mb-1">
                          {isWin ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            : isLost ? <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            : <AlertCircle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                          <span className="text-xs font-semibold text-gray-800 truncate">{path.label || `Path ${i + 1}`}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 truncate">{path.seller_strategy}</div>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase',
                            isWin ? 'bg-green-100 text-green-700' : isLost ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                          )}>{path.outcome || 'stalled'}</span>
                          <span className="text-[10px] text-indigo-600 font-medium">{Math.round((path.win_probability || 0) * 100)}% win</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Active Path Detail */}
              {(() => {
                const path = simData.simulation_paths[activePath]
                if (!path) return null
                const isWin = path.outcome === 'won'
                const isLost = path.outcome === 'lost'
                return (
                  <div className="flex-1 flex overflow-hidden">
                    {/* Turn-by-turn log */}
                    <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200">
                      <div className="px-4 py-2.5 border-b border-gray-100 bg-white flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-2">
                          {isWin ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                            : isLost ? <XCircle className="w-4 h-4 text-red-400" />
                            : <AlertCircle className="w-4 h-4 text-yellow-400" />}
                          <span className="font-semibold text-gray-900 text-sm">{path.label || `Path ${activePath + 1}`}</span>
                        </div>
                        <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded uppercase',
                          isWin ? 'bg-green-100 text-green-700' : isLost ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                        )}>{path.outcome || 'stalled'}</span>
                        <span className="text-xs text-gray-500">{path.rounds_played || path.turns?.length || 0} rounds</span>
                        <div className="flex-1" />
                        <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
                          Win prob: {Math.round((path.win_probability || 0) * 100)}%
                        </span>
                      </div>

                      {/* Summary banner */}
                      {path.summary && (
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs text-gray-600 italic">
                          {path.summary}
                        </div>
                      )}

                      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                        {(path.turns || []).map((turn: any, ti: number) => {
                          const isSeller = turn.actor?.toLowerCase().includes('seller') || turn.actor_label?.toLowerCase().includes('seller')
                          const isAdj = turn.actor?.toLowerCase().includes('adj') || turn.action_type === 'adjudication'
                          return (
                            <div key={ti} className={cn('rounded-lg p-3 text-sm',
                              isSeller ? 'bg-blue-50 ml-8' : isAdj ? 'bg-gray-50 border border-gray-200' : 'bg-white border border-gray-200 mr-8'
                            )}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-xs text-gray-700">{turn.actor || turn.actor_label || 'Unknown'}</span>
                                {turn.action_type && (
                                  <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', ACTION_COLORS[turn.action_type] || 'bg-gray-100 text-gray-600')}>
                                    {turn.action_type.replace(/_/g, ' ')}
                                  </span>
                                )}
                                <span className="text-[10px] text-gray-400 ml-auto">R{turn.round ?? ti + 1}</span>
                                {turn.trust_delta !== undefined && turn.trust_delta !== 0 && (
                                  <span className={cn('text-[10px] font-medium flex items-center gap-0.5',
                                    turn.trust_delta > 0 ? 'text-green-600' : 'text-red-500'
                                  )}>
                                    {turn.trust_delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {turn.trust_delta > 0 ? '+' : ''}{turn.trust_delta}
                                  </span>
                                )}
                              </div>
                              <div className="text-gray-800">{turn.message || turn.content || ''}</div>
                              {isAdj && turn.coaching_tip && (
                                <div className="mt-1.5 text-[10px] text-amber-700 flex items-start gap-1">
                                  <span>💡</span><span>{turn.coaching_tip}</span>
                                </div>
                              )}
                              {isAdj && (
                                <button
                                  onClick={() => { setPathMcRound(turn.round ?? ti + 1); setPathMcOpen(true) }}
                                  className="mt-1.5 text-[10px] text-purple-600 hover:text-purple-800 underline flex items-center gap-1">
                                  <BarChart2 className="w-3 h-3" /> Run MC from R{turn.round ?? ti + 1}
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Right panel: key moments + deal state */}
                    <div className="w-64 overflow-y-auto flex flex-col">
                      {/* Key Moments */}
                      {path.key_moments?.length > 0 && (
                        <div className="p-4 border-b border-gray-100">
                          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Key Moments</div>
                          <div className="space-y-2">
                            {path.key_moments.map((km: any, ki: number) => (
                              <div key={ki} className="text-xs">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">R{km.round}</span>
                                  <span className={cn('text-[10px] font-medium px-1 py-0.5 rounded',
                                    km.impact === 'positive' ? 'bg-green-100 text-green-700' :
                                    km.impact === 'negative' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                                  )}>{km.impact || 'neutral'}</span>
                                </div>
                                <p className="text-gray-700">{km.description || km.event}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Deal State Evolution */}
                      {path.deal_state_evolution?.length > 0 && (
                        <div className="p-4 border-b border-gray-100">
                          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Deal State Evolution</div>
                          <div className="space-y-1.5">
                            {path.deal_state_evolution.map((ds: any, di: number) => (
                              <div key={di} className="text-xs">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-gray-500">R{ds.round}</span>
                                  <div className="flex items-center gap-2 text-[10px]">
                                    {ds.trust_score !== undefined && (
                                      <span className={cn('font-medium',
                                        ds.trust_score >= 60 ? 'text-green-600' : ds.trust_score >= 40 ? 'text-yellow-600' : 'text-red-500'
                                      )}>Trust {ds.trust_score}</span>
                                    )}
                                    {ds.win_probability !== undefined && (
                                      <span className="text-indigo-600 font-medium">{Math.round(ds.win_probability * 100)}%</span>
                                    )}
                                  </div>
                                </div>
                                {ds.trust_score !== undefined && (
                                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={cn('h-full rounded-full transition-all',
                                      ds.trust_score >= 60 ? 'bg-green-400' : ds.trust_score >= 40 ? 'bg-yellow-400' : 'bg-red-400'
                                    )} style={{ width: `${ds.trust_score}%` }} />
                                  </div>
                                )}
                                {ds.momentum && (
                                  <div className="text-[10px] text-gray-400 mt-0.5">{ds.momentum}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Path Config */}
                      <div className="p-4 border-b border-gray-100">
                        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Path Config</div>
                        <div className="space-y-1 text-xs text-gray-500">
                          {path.seller_strategy && <div><span className="font-medium text-gray-700">Seller:</span> {path.seller_strategy}</div>}
                          {path.buyer_stance && <div><span className="font-medium text-gray-700">Buyer:</span> {path.buyer_stance}</div>}
                          {path.scenario_twist && <div><span className="font-medium text-gray-700">Twist:</span> {path.scenario_twist}</div>}
                        </div>
                      </div>

                      {/* Monte Carlo for this path */}
                      <div className="p-4">
                        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Monte Carlo</div>
                        {path.monte_carlo_status === 'running' ? (
                          <div className="flex items-center gap-2 text-xs text-purple-600">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Running...
                          </div>
                        ) : path.monte_carlo ? (
                          <div className="space-y-2">
                            <div className="text-xs text-gray-500">
                              {path.monte_carlo.total_runs} runs from R{path.monte_carlo.from_round}
                              — win rate: <span className="font-semibold text-gray-800">{Math.round((path.monte_carlo.win_rate || 0) * 100)}%</span>
                            </div>
                            <div className="space-y-1">
                              {Object.entries(path.monte_carlo.outcomes || {}).map(([outcome, count]) => {
                                const pct = Math.round(((count as number) / path.monte_carlo.total_runs) * 100)
                                return (
                                  <div key={outcome}>
                                    <div className="flex justify-between text-[10px] mb-0.5">
                                      <span className="capitalize">{outcome}</span>
                                      <span className="font-medium">{pct}%</span>
                                    </div>
                                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                      <div className={cn('h-full rounded-full',
                                        outcome === 'won' ? 'bg-green-500' : outcome === 'lost' ? 'bg-red-400' : 'bg-gray-400'
                                      )} style={{ width: `${pct}%` }} />
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                            {path.monte_carlo.recommended_next_move && (
                              <div className="text-[10px] text-amber-700 bg-amber-50 rounded p-2 mt-1">
                                💡 {path.monte_carlo.recommended_next_move}
                              </div>
                            )}
                            {path.monte_carlo.risk_factors?.length > 0 && (
                              <div className="text-[10px] text-gray-500 space-y-0.5">
                                {path.monte_carlo.risk_factors.map((r: string, i: number) => (
                                  <div key={i}>⚠ {r}</div>
                                ))}
                              </div>
                            )}
                            <button onClick={() => { setPathMcRound(null); setPathMcOpen(true) }}
                              className="mt-1 text-[10px] text-purple-600 hover:text-purple-800 underline">
                              Re-run MC
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => { setPathMcRound(null); setPathMcOpen(true) }}
                            className="w-full flex items-center justify-center gap-1.5 border border-purple-300 text-purple-700 px-3 py-2 rounded-lg text-xs font-medium hover:bg-purple-50">
                            <BarChart2 className="w-3.5 h-3.5" /> Run Monte Carlo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      )}

      {/* ── Normal game view ── */}
      {view !== 'paths' && gameLoading ? (
        <div className="flex-1 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
      ) : view !== 'paths' && (
        <div className="flex-1 flex overflow-hidden">
          {/* Turn Log */}
          <div className="flex-1 flex flex-col border-r border-gray-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Turn Log — Round {game?.current_round || 0}/{game?.max_rounds || 10}
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {(game?.turns || []).map((turn: any) => (
                <div key={turn.id} className={cn('rounded-lg p-3 text-sm',
                  turn.actor_label === 'Seller' || turn.actor_label === 'Seller (AI)' ? 'bg-blue-50 ml-8' :
                  turn.actor_label === 'Adjudicator' ? 'bg-gray-50 border border-gray-200' :
                  'bg-white border border-gray-200 mr-8'
                )}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-semibold text-xs text-gray-700">{turn.actor_label}</span>
                    <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', ACTION_COLORS[turn.action_type] || 'bg-gray-100 text-gray-600')}>
                      {turn.action_type?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-gray-400 ml-auto">R{turn.round_number}</span>
                  </div>
                  <div className="text-gray-800">
                    {typeof turn.content === 'object' ? (
                      turn.content?.message || turn.content?.summary || JSON.stringify(turn.content).slice(0, 200)
                    ) : String(turn.content || '')}
                  </div>
                  {turn.content?.coaching_tips?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      {turn.content.coaching_tips.map((tip: string, i: number) => (
                        <div key={i} className="text-xs text-amber-700 flex items-start gap-1">
                          <span>💡</span><span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {(game?.turns || []).length === 0 && (
                <div className="text-center text-gray-400 text-sm py-8">
                  {isSetup ? 'Start the game to see the opening intelligence briefings.' : 'No turns yet.'}
                </div>
              )}
              {(isAutoRunning || isProcessing) && (
                <div className="flex items-center gap-2 text-blue-600 text-sm">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {isAutoRunning ? 'Auto-running...' : 'Processing turn...'}
                </div>
              )}
            </div>
          </div>

          {/* Deal Dashboard */}
          <div className="w-64 flex flex-col border-r border-gray-200 overflow-y-auto">
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Deal Dashboard
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="text-xs font-semibold text-gray-600 mb-2">Buyer Trust</div>
                {(game?.participants || []).filter((p: any) => p.team === 'buyer').map((p: any) => (
                  <div key={p.id} className="mb-2">
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <span className="text-gray-700 truncate">{p.profile?.name || `Buyer ${p.id}`}</span>
                      <span className={cn('font-semibold',
                        p.current_trust_score >= 60 ? 'text-green-600' :
                        p.current_trust_score >= 40 ? 'text-yellow-600' : 'text-red-500'
                      )}>
                        {p.current_trust_score}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all',
                        p.current_trust_score >= 60 ? 'bg-green-500' :
                        p.current_trust_score >= 40 ? 'bg-yellow-400' : 'bg-red-400'
                      )} style={{ width: `${p.current_trust_score}%` }} />
                    </div>
                    {p.engagement_level && (
                      <div className="text-[10px] text-gray-400 mt-0.5">{p.engagement_level}</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3">
                <div className="text-xs font-semibold text-gray-600 mb-2">Context</div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div><span className="font-medium">Stage:</span> {game?.presales_stage}</div>
                  <div><span className="font-medium">Scenario:</span> {game?.scenario_type?.replace(/_/g, ' ')}</div>
                  {game?.outcome && <div><span className="font-medium">Outcome:</span> <span className={game.outcome === 'won' ? 'text-green-600' : 'text-red-500'}>{game.outcome}</span></div>}
                </div>
              </div>

              {game?.monte_carlo_results && (
                <div className="border-t border-gray-100 pt-3">
                  <div className="text-xs font-semibold text-gray-600 mb-2">Monte Carlo ({game.monte_carlo_results.total_runs} runs)</div>
                  <div className="space-y-1">
                    {Object.entries(game.monte_carlo_results.outcomes || {}).map(([outcome, count]) => {
                      const pct = Math.round(((count as number) / game.monte_carlo_results.total_runs) * 100)
                      return (
                        <div key={outcome}>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="capitalize">{outcome}</span>
                            <span className="font-medium">{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full',
                              outcome === 'won' ? 'bg-green-500' : outcome === 'lost' ? 'bg-red-400' : 'bg-gray-400'
                            )} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">Win rate: <span className="font-semibold text-gray-700">{Math.round((game.monte_carlo_results.win_rate || 0) * 100)}%</span></div>
                </div>
              )}
              {game?.monte_carlo_status === 'running' && (
                <div className="flex items-center gap-2 text-xs text-blue-600 border-t border-gray-100 pt-3">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />Monte Carlo running...
                </div>
              )}
            </div>
          </div>

          {/* Action Bar */}
          <div className="w-72 flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Your Move
            </div>
            <div className="flex-1 p-4 space-y-3">
              {isActive ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Action Type</label>
                    <select value={turnForm.action_type} onChange={e => setTurnForm(f => ({ ...f, action_type: e.target.value }))}
                      className="w-full text-sm border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500">
                      {ACTION_TYPES.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Your Message</label>
                    <textarea value={turnForm.message} onChange={e => setTurnForm(f => ({ ...f, message: e.target.value }))}
                      rows={5} placeholder="What do you say/propose?"
                      className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Terms (optional JSON)</label>
                    <textarea value={turnForm.terms} onChange={e => setTurnForm(f => ({ ...f, terms: e.target.value }))}
                      rows={2} placeholder='{"price": 180000, "payment": "annual"}'
                      className="w-full text-sm font-mono border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Auto-Run Strategy</label>
                    <input value={autoStrategy} onChange={e => setAutoStrategy(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Win at best terms..." />
                  </div>
                  <button onClick={handleSubmitTurn} disabled={submitTurn.isPending || !turnForm.message.trim()}
                    className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitTurn.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                    Submit Turn
                  </button>
                </>
              ) : isAutoRunning ? (
                <div className="text-center text-sm text-blue-600 py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
                  Auto-running simulation...
                  <div className="mt-4">
                    <button onClick={() => handleAutoRun(false)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-red-700">
                      Stop
                    </button>
                  </div>
                </div>
              ) : isSetup ? (
                <div className="text-center text-sm text-gray-400 py-8">
                  <Play className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  Click Start to begin the simulation
                </div>
              ) : isCompleted ? (
                <div className="text-center text-sm text-gray-500 py-8">
                  <div className={cn('text-lg font-bold mb-2', game?.outcome === 'won' ? 'text-green-600' : 'text-red-500')}>
                    {game?.outcome?.toUpperCase()}
                  </div>
                  <p className="text-xs text-gray-400">{game?.outcome_summary || 'Game completed.'}</p>
                  <button onClick={() => setView('analysis')} className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-purple-700">
                    View Analysis
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Simulate Paths Modal */}
      {simOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-96 mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold">Simulate Paths</h2>
              </div>
              <button onClick={() => setSimOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-600">
                AI will simulate multiple complete negotiation paths in parallel — each with a different seller strategy, buyer stance, and scenario twist.
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Number of Paths</label>
                <select value={simNPaths} onChange={e => setSimNPaths(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="2">2 paths</option>
                  <option value="3">3 paths</option>
                  <option value="4">4 paths (recommended)</option>
                  <option value="5">5 paths</option>
                </select>
              </div>
              <p className="text-xs text-gray-400">Each path shows a full turn-by-turn log, key moments, deal state evolution, and outcome.</p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button onClick={() => setSimOpen(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={handleSimulatePaths} disabled={simulatePaths.isPending}
                className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                {simulatePaths.isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
                Generate Paths
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared MC config panel — rendered inside both MC modals */}
      {(pathMcOpen || mcOpen) && (() => {
        const isPath = pathMcOpen
        const title = isPath ? `Monte Carlo — Path ${activePath + 1}` : 'Monte Carlo Simulation'
        const onClose = isPath ? () => setPathMcOpen(false) : () => setMcOpen(false)
        const onRun = isPath ? handlePathMonteCarlo : handleMonteCarlo
        const isPending = isPath ? pathMC.isPending : runMC.isPending
        const runs = isPath ? pathMcRuns : mcRuns
        const setRuns = isPath ? setPathMcRuns : setMcRuns

        const STRATEGY_PRESETS: Record<string, Record<string, number>> = {
          value:        { value_anchor: 3, reference_proof: 3, exec_alignment: 2, information_share: 2, concession: 1, close_attempt: 1 },
          aggressive:   { urgency: 3, close_attempt: 3, price_reduction: 2, push_back: 2, concession: 1, value_anchor: 1 },
          relationship: { exec_alignment: 4, information_share: 3, reference_proof: 2, concession: 2, value_anchor: 1, close_attempt: 1 },
          technical:    { technical_demo: 4, information_share: 3, value_anchor: 2, reference_proof: 2, close_attempt: 1 },
        }

        const ACTION_LABELS: Record<string, string> = {
          value_anchor: 'Value/ROI', concession: 'Concession', reference_proof: 'References',
          exec_alignment: 'Exec Align', technical_demo: 'Tech Demo', information_share: 'Info Share',
          price_reduction: 'Price Cut', urgency: 'Urgency', push_back: 'Push Back', close_attempt: 'Close',
        }

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-[520px] mx-4 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-semibold">{title}</h2>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">Native Engine</span>
                </div>
                <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Basic */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Simulations</label>
                    <input type="number" min="100" max="2000" step="100" value={runs} onChange={e => setRuns(e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    <p className="text-[10px] text-gray-400 mt-0.5">100–2000 runs (~40ms/1000)</p>
                  </div>
                  {isPath && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">From Round</label>
                      <input type="number" min="1" value={pathMcRound ?? ''} placeholder="Last round"
                        onChange={e => setPathMcRound(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                  )}
                </div>

                {/* Advanced toggle */}
                <button onClick={() => setShowMcAdvanced(v => !v)}
                  className="flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-800">
                  <ChevronRight className={cn('w-3.5 h-3.5 transition-transform', showMcAdvanced && 'rotate-90')} />
                  {showMcAdvanced ? 'Hide' : 'Show'} advanced parameters
                </button>

                {showMcAdvanced && (
                  <div className="space-y-5 border-t border-gray-100 pt-4">
                    {/* Win/Loss thresholds */}
                    <div>
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Close Conditions</div>
                      <div className="space-y-3">
                        {[
                          { key: 'win_threshold',   label: 'Win threshold',      min: 50,  max: 90,  hint: 'Composite trust needed to attempt close' },
                          { key: 'kdm_win_min',     label: 'KDM minimum trust',  min: 30,  max: 80,  hint: 'Each key decision maker must exceed this' },
                          { key: 'loss_threshold',  label: 'Loss threshold',     min: 5,   max: 40,  hint: 'KDM below this → deal lost' },
                          { key: 'min_close_round', label: 'Min close round',    min: 1,   max: 8,   hint: 'Earliest round a close can succeed' },
                        ].map(({ key, label, min, max, hint }) => (
                          <div key={key}>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-medium text-gray-700">{label}</label>
                              <span className="text-xs font-mono font-semibold text-purple-700 w-8 text-right">
                                {mcConfig[key as keyof typeof mcConfig] as number}
                              </span>
                            </div>
                            <input type="range" min={min} max={max} step={1}
                              value={mcConfig[key as keyof typeof mcConfig] as number}
                              onChange={e => setMcConfig(c => ({ ...c, [key]: parseInt(e.target.value) }))}
                              className="w-full accent-purple-600" />
                            <p className="text-[10px] text-gray-400">{hint}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Random events */}
                    <div>
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Random Deal Events</div>
                      <div className="space-y-2">
                        {([
                          { key: 'competitor_enters', label: 'Competitor enters',   impact: '−10 trust all buyers' },
                          { key: 'budget_concern',    label: 'Budget concern',      impact: '−5 trust all buyers' },
                          { key: 'champion_boost',    label: 'Champion boosts deal',impact: '+5 trust non-champions' },
                          { key: 'exec_pressure',     label: 'Exec pressure',       impact: '−8 trust (if high-ego KDM)' },
                        ] as { key: string; label: string; impact: string }[]).map(({ key, label, impact }) => {
                          const enabledKey = `event_${key}_enabled` as keyof typeof mcConfig
                          const enabled = mcConfig[enabledKey] as boolean
                          const prob = mcConfig.event_probs[key as keyof typeof mcConfig.event_probs]
                          return (
                            <div key={key} className={cn('rounded-lg border p-2.5', enabled ? 'border-gray-200' : 'border-gray-100 opacity-50')}>
                              <div className="flex items-center gap-2 mb-1.5">
                                <input type="checkbox" checked={enabled}
                                  onChange={e => setMcConfig(c => ({ ...c, [enabledKey]: e.target.checked }))}
                                  className="accent-purple-600" />
                                <span className="text-xs font-medium text-gray-700">{label}</span>
                                <span className="text-[10px] text-gray-400 ml-auto">{impact}</span>
                              </div>
                              {enabled && (
                                <div className="flex items-center gap-2">
                                  <input type="range" min={0} max={0.25} step={0.01}
                                    value={prob}
                                    onChange={e => setMcConfig(c => ({
                                      ...c, event_probs: { ...c.event_probs, [key]: parseFloat(e.target.value) }
                                    }))}
                                    className="flex-1 accent-purple-600" />
                                  <span className="text-[10px] font-mono text-purple-700 w-10 text-right">
                                    {Math.round(prob * 100)}%/rnd
                                  </span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Strategy / action weights */}
                    <div>
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Seller Strategy</div>
                      <div className="flex gap-2 flex-wrap mb-3">
                        {(['auto', 'value', 'aggressive', 'relationship', 'technical', 'custom'] as const).map(p => (
                          <button key={p} onClick={() => {
                            const weights = p !== 'auto' && p !== 'custom' ? { ...STRATEGY_PRESETS[p] } : (p === 'custom' ? { ...STRATEGY_PRESETS.value } : null)
                            setMcConfig(c => ({ ...c, strategy_preset: p, action_weights: weights }))
                          }}
                            className={cn('px-2.5 py-1 rounded text-xs font-medium capitalize border',
                              mcConfig.strategy_preset === p
                                ? 'bg-purple-600 text-white border-purple-600'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
                            )}>
                            {p}
                          </button>
                        ))}
                      </div>
                      {mcConfig.strategy_preset === 'custom' && mcConfig.action_weights && (
                        <div className="space-y-2">
                          {Object.entries(ACTION_LABELS).map(([action, label]) => {
                            const w = mcConfig.action_weights![action] ?? 0
                            return (
                              <div key={action} className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-600 w-24 shrink-0">{label}</span>
                                <input type="range" min={0} max={6} step={0.5} value={w}
                                  onChange={e => setMcConfig(c => ({
                                    ...c, action_weights: { ...c.action_weights!, [action]: parseFloat(e.target.value) }
                                  }))}
                                  className="flex-1 accent-purple-600" />
                                <span className="text-[10px] font-mono text-purple-700 w-6 text-right">{w}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <button onClick={() => setMcConfig({ ...DEFAULT_MC_CONFIG })}
                      className="text-xs text-gray-400 hover:text-gray-600 underline">
                      Reset to defaults
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t shrink-0">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
                <button onClick={onRun} disabled={isPending}
                  className="px-6 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2">
                  {isPending && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Run {runs} Simulations
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Inject Modal */}
      {injectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-96 mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Inject Scenario</h2>
              <button onClick={() => setInjectOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Scenario Type</label>
                <input value={injectForm.scenario} onChange={e => setInjectForm(f => ({ ...f, scenario: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="champion_left_company" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea value={injectForm.description} onChange={e => setInjectForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Your champion just left the company..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t">
              <button onClick={() => setInjectOpen(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={handleInject} className="px-6 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700">Inject</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
