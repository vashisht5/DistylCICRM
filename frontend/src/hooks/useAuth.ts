import { useMe } from '@/lib/api'

export function useAuth() {
  const { data: user, isLoading, error } = useMe()
  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    role: user?.role as string | undefined,
    isAdmin: user?.role === 'admin',
    isAnalyst: ['admin', 'analyst'].includes(user?.role || ''),
    canWrite: ['admin', 'analyst'].includes(user?.role || ''),
  }
}
