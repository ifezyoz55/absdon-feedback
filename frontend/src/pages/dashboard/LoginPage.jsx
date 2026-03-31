import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Loader2, Lock, Zap, AlertCircle } from 'lucide-react'
import logo from '../../assets/logo.png'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(form.username, form.password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-void-900 bg-grid-pattern flex items-center justify-center px-6">
      {/* Ambient glows */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-emerald/5 blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/3 w-64 h-64 rounded-full bg-violet/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-12">
          <img
  src={logo}
  alt="Absdon Logo"
  className="w-24 h-24 mx-auto mb-6 object-contain drop-shadow-[0_0_25px_rgba(16,185,129,0.35)]"
/>
          <h1 className="font-display font-bold text-xl text-ink-100">Team Dashboard</h1>
          <p className="text-ink-400 text-sm mt-1 font-body">
  Absdon Feedback System
</p>
        </div>

        <div className="card">
          <form onSubmit={handle} className="space-y-5">
            <div>
              <label className="label">Username</label>
              <input
                className="input-field"
                type="text"
                placeholder="your_username"
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input-field"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex items-center gap-2 py-3">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                : <><Lock className="w-4 h-4" /> Sign In</>
              }
            </button>
          </form>

          <p className="text-center text-ink-500 text-xs mt-5 font-mono">
            Accounts are created by system admins only
          </p>
        </div>

        <p className="text-center mt-6">
          <a href="/" className="text-xs text-ink-500 hover:text-emerald transition-colors font-mono">
            ← Back to Feedback Form
          </a>
        </p>
      </div>
    </div>
  )
}
