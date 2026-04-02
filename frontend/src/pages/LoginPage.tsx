import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { login } from '../services/api'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { setAuth } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, user } = await login(email, password)
      setAuth(user, token)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Invalid credentials'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base px-4 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full opacity-30 blur-[100px]"
             style={{ background: 'radial-gradient(circle,#6366f1 0%,transparent 70%)' }} />
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full opacity-20 blur-[100px]"
             style={{ background: 'radial-gradient(circle,#7c3aed 0%,transparent 70%)' }} />
        <div className="absolute inset-0 dot-grid opacity-40" />
      </div>

      <div className="w-full max-w-md relative animate-slide-up">
        {/* Outer glow ring */}
        <div className="absolute -inset-px rounded-3xl opacity-40 blur-sm"
             style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.4) 0%,transparent 50%,rgba(124,58,237,0.3) 100%)' }} />

        <div className="card-accent relative rounded-3xl overflow-hidden">
          <div className="h-1 w-full"
               style={{ background: 'linear-gradient(90deg,#6366f1 0%,#7c3aed 50%,#06b6d4 100%)' }} />

          <div className="p-8 pt-7">
            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg,#6366f1 0%,#7c3aed 100%)', boxShadow: '0 8px 32px rgba(99,102,241,0.45)' }}>
                  <Zap className="w-8 h-8 text-white" fill="currentColor" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-base border-2 border-emerald-400 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
              </div>
              <h1 className="text-3xl font-bold tracking-tight gradient-text">CoreX</h1>
              <p className="text-sm mt-1.5 text-muted">APK Version Control & Distribution</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="label">Email address</label>
                <input id="email" type="email" autoComplete="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" className="input" />
              </div>
              <div>
                <label htmlFor="password" className="label">Password</label>
                <div className="relative">
                  <input id="password" type={showPw ? 'text' : 'password'}
                    autoComplete="current-password" required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" className="input pr-11" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3.5 py-2.5 rounded-xl">
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5" />
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} id="login-submit"
                className="btn-primary w-full justify-center py-3 mt-1 text-base">
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                  : 'Sign in to CoreX'}
              </button>
            </form>

            <p className="text-center text-xs text-muted mt-6">Secured by JWT · CoreX v1.0</p>
          </div>
        </div>
      </div>
    </div>
  )
}
