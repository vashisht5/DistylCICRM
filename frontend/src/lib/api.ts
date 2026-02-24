import axios from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const api = axios.create({ baseURL: '', withCredentials: true })

// ── Auth ─────────────────────────────────────────────────────────
export const useMe = () =>
  useQuery({ queryKey: ['me'], queryFn: () => api.get('/auth/me').then(r => r.data), retry: false })

export const useDevLogin = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { email?: string; role?: string }) => api.post('/auth/dev-login', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  })
}

// ── Entities ─────────────────────────────────────────────────────
export const useEntities = (params?: Record<string, string>) =>
  useQuery({ queryKey: ['entities', params], queryFn: () => api.get('/api/entities', { params }).then(r => r.data) })

export const useEntity = (id: number | null) =>
  useQuery({ queryKey: ['entity', id], queryFn: () => api.get(`/api/entities/${id}`).then(r => r.data), enabled: !!id })

export const useEntityStats = () =>
  useQuery({ queryKey: ['entity-stats'], queryFn: () => api.get('/api/entities/stats').then(r => r.data) })

export const useCreateEntity = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/api/entities', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entities'] }),
  })
}

export const useUpdateEntity = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => api.put(`/api/entities/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['entities'] }),
  })
}

// ── News ──────────────────────────────────────────────────────────
export const useNews = (params?: Record<string, string>) =>
  useQuery({ queryKey: ['news', params], queryFn: () => api.get('/api/news', { params }).then(r => r.data), refetchInterval: 60000 })

export const useNewsStats = () =>
  useQuery({ queryKey: ['news-stats'], queryFn: () => api.get('/api/news/stats').then(r => r.data) })

export const useRefreshNews = () =>
  useMutation({ mutationFn: (entityId: number) => api.post('/api/news/refresh', { entity_id: entityId }).then(r => r.data) })

// ── Signals ───────────────────────────────────────────────────────
export const useSignals = (params?: Record<string, string>) =>
  useQuery({ queryKey: ['signals', params], queryFn: () => api.get('/api/signals', { params }).then(r => r.data), refetchInterval: 30000 })

export const useSignalStats = () =>
  useQuery({ queryKey: ['signal-stats'], queryFn: () => api.get('/api/signals/stats').then(r => r.data), refetchInterval: 60000 })

export const useReviewSignal = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.post(`/api/signals/${id}/review`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['signals'] }),
  })
}

// ── Dossiers ──────────────────────────────────────────────────────
export const useDossiers = (entityId?: number) =>
  useQuery({ queryKey: ['dossiers', entityId], queryFn: () => api.get('/api/dossiers', { params: entityId ? { entity_id: entityId } : {} }).then(r => r.data) })

export const useDossier = (id: number | null) =>
  useQuery({
    queryKey: ['dossier', id],
    queryFn: () => api.get(`/api/dossiers/${id}`).then(r => r.data),
    enabled: !!id,
    refetchInterval: (q) => {
      const data = q.state.data as any
      return data?.generation_status === 'in_progress' || data?.generation_status === 'pending' ? 5000 : false
    }
  })

export const useGenerateDossier = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (entityId: number) => api.post('/api/dossiers/generate', { entity_id: entityId }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dossiers'] }),
  })
}

export const useCeoBrief = (dossierId: number | null) =>
  useQuery({ queryKey: ['ceo-brief', dossierId], queryFn: () => api.get(`/api/dossiers/${dossierId}/ceo-brief`).then(r => r.data), enabled: !!dossierId })

export const useRegenerateCeoBrief = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dossierId: number) => api.post(`/api/dossiers/${dossierId}/ceo-brief`).then(r => r.data),
    onSuccess: (_, dossierId) => qc.invalidateQueries({ queryKey: ['ceo-brief', dossierId] }),
  })
}

export const useFlagHallucination = () =>
  useMutation({
    mutationFn: ({ dossierId, section, claim }: { dossierId: number; section: string; claim: string }) =>
      api.post(`/api/dossiers/${dossierId}/flag-hallucination`, { section, claim }).then(r => r.data),
  })

// ── People ────────────────────────────────────────────────────────
export const usePeople = (params?: Record<string, string>) =>
  useQuery({ queryKey: ['people', params], queryFn: () => api.get('/api/people', { params }).then(r => r.data) })

export const useCreatePerson = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/api/people', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['people'] }),
  })
}

// ── Pipeline ──────────────────────────────────────────────────────
export const useDeals = (params?: Record<string, string>) =>
  useQuery({ queryKey: ['deals', params], queryFn: () => api.get('/api/deals', { params }).then(r => r.data) })

export const useCompetitiveMap = () =>
  useQuery({ queryKey: ['competitive-map'], queryFn: () => api.get('/api/deals/competitive-map').then(r => r.data) })

export const useCreateDeal = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/api/deals', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deals'] }),
  })
}

export const useUpdateDeal = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => api.put(`/api/deals/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deals'] }),
  })
}

// ── Partnerships ──────────────────────────────────────────────────
export const usePartnerships = () =>
  useQuery({ queryKey: ['partnerships'], queryFn: () => api.get('/api/partnerships').then(r => r.data) })

export const usePartnershipGraph = () =>
  useQuery({ queryKey: ['partnership-graph'], queryFn: () => api.get('/api/partnerships/graph').then(r => r.data) })

export const useCreatePartnership = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/api/partnerships', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partnerships'] }),
  })
}

// ── Battle Cards ──────────────────────────────────────────────────
export const useBattleCards = (params?: Record<string, string>) =>
  useQuery({ queryKey: ['battle-cards', params], queryFn: () => api.get('/api/battle-cards', { params }).then(r => r.data) })

export const useBattleCard = (id: number | null) =>
  useQuery({ queryKey: ['battle-card', id], queryFn: () => api.get(`/api/battle-cards/${id}`).then(r => r.data), enabled: !!id })

export const useGenerateBattleCard = () =>
  useMutation({ mutationFn: (data: Record<string, unknown>) => api.post('/api/battle-cards/generate', data).then(r => r.data) })

export const useApproveBattleCard = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.post(`/api/battle-cards/${id}/approve`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['battle-cards'] }),
  })
}

// ── Digests ───────────────────────────────────────────────────────
export const useDigests = () =>
  useQuery({ queryKey: ['digests'], queryFn: () => api.get('/api/digests').then(r => r.data) })

export const useDigest = (id: number | null) =>
  useQuery({ queryKey: ['digest', id], queryFn: () => api.get(`/api/digests/${id}`).then(r => r.data), enabled: !!id })

export const useGenerateDigest = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/api/digests/generate').then(r => r.data),
    onSuccess: () => setTimeout(() => qc.invalidateQueries({ queryKey: ['digests'] }), 5000),
  })
}

export const usePostDigestToSlack = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.post(`/api/digests/${id}/post-slack`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['digests'] }),
  })
}

// ── Chat ──────────────────────────────────────────────────────────
export const useChat = () =>
  useMutation({ mutationFn: (data: { message: string; history: unknown[] }) => api.post('/api/chat', data).then(r => r.data) })

// ── Admin ─────────────────────────────────────────────────────────
export const useAdminUsers = () =>
  useQuery({ queryKey: ['admin-users'], queryFn: () => api.get('/api/admin/users').then(r => r.data) })

export const useUpdateUserRole = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => api.put(`/api/admin/users/${id}/role`, { role }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })
}
