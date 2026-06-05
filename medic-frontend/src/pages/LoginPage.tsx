import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { api } from '../lib/api'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { username, password })
      login(data.user, data.accessToken)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      setError(msg || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16
            rounded-2xl bg-[var(--accent)] mb-4">
            <span className="font-display font-bold text-white text-2xl">M</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-[var(--text-primary)]">
            M.E.D.I.C.
          </h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm">
            Healthcare Interoperability Hub
          </p>
        </div>

        {/* Card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8">
          <h2 className="font-display text-xl font-semibold text-[var(--text-primary)] mb-6">
            Sign in
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20
              text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)]
                  bg-[var(--bg-primary)] text-[var(--text-primary)]
                  focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50
                  focus:border-[var(--accent)] transition-colors text-sm"
                placeholder="admin"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-[var(--border)]
                  bg-[var(--bg-primary)] text-[var(--text-primary)]
                  focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50
                  focus:border-[var(--accent)] transition-colors text-sm"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[var(--accent)]
                hover:bg-[var(--accent-hover)] text-white font-medium text-sm
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--text-secondary)] mt-4">
            No account?{' '}
            <Link to="/register" className="text-[var(--accent)] hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
