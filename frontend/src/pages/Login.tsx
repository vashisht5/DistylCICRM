import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useDevLogin } from '@/lib/api'
import { TMobileMark } from '@/components/ui/TMobileMark'

export default function Login() {
  const navigate = useNavigate()
  const devLogin = useDevLogin()
  const [loading, setLoading] = useState(false)
  const isDev = import.meta.env.DEV

  function handleGoogleLogin() {
    setLoading(true)
    window.location.href = '/auth/google'
  }

  async function handleDevLogin(role: string) {
    await devLogin.mutateAsync({ email: `dev-${role}@distyl.ai`, role })
    navigate('/negotiations')
  }

  return (
    <div className="min-h-screen bg-tdds-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand lockup */}
        <div className="flex items-center gap-3 mb-10">
          <TMobileMark size={40} />
          <div className="leading-tight">
            <div className="font-display text-base font-bold text-tdds-900 tracking-tight">Procurement Co-Pilot</div>
            <div className="text-[11px] text-tdds-500 font-semibold uppercase tracking-wider mt-0.5">T-Mobile · Device Negotiations</div>
          </div>
        </div>

        {/* Editorial display copy */}
        <div className="mb-10">
          <h1 className="font-display text-[44px] font-extrabold text-tdds-900 leading-[1.05] tracking-tight mb-4">
            Negotiate every device cycle with a quantified counter-offer.
          </h1>
          <p className="text-tdds-500 text-[15px] leading-relaxed max-w-md">
            Carrier-side negotiation workspace for the Q1 2026 device cycle.
          </p>
        </div>

        {/* Sign-in card */}
        <div className="bg-white rounded-md ring-1 ring-tdds-200 p-6">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-tdds-900 text-white rounded-sm hover:bg-tdds-800 transition-colors font-semibold text-[13px] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" opacity=".88"/>
                <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" opacity=".7"/>
                <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" opacity=".55"/>
              </svg>
            )}
            Continue with Google
          </button>

          {isDev && (
            <div className="mt-5 pt-5 border-t border-tdds-200">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-tdds-400 mb-2.5 text-center">Dev bypass</p>
              <div className="grid grid-cols-4 gap-1.5">
                {['admin', 'analyst', 'sales', 'viewer'].map(r => (
                  <button
                    key={r}
                    onClick={() => handleDevLogin(r)}
                    className="px-2.5 py-1.5 text-[12px] font-medium ring-1 ring-inset ring-tdds-300 rounded-sm hover:bg-tdds-50 hover:ring-tdds-400 capitalize text-tdds-700 transition-colors"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-tdds-400 text-[11px] mt-6 font-medium">
          Restricted to authorized procurement personnel
        </p>
      </div>
    </div>
  )
}
