import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { api } from '../lib/api'

const ROLES = [
  { value: 'CLINICIAN',      label: 'Clinician (Doctor / Nurse)' },
  { value: 'PHARMACY',       label: 'Pharmacy Staff' },
  { value: 'FACILITY_ADMIN', label: 'Facility Administrator' },
  { value: 'ANALYST',        label: 'Data Analyst' },
]

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '', email: '', password: '', fullName: '',
    role: 'CLINICIAN', facilityId: '', facilityName: '',
  })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const { login }             = useAuthStore()
  const navigate              = useNavigate()

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', form)
      login(data.user, data.accessToken)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      setError(msg || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = `w-full px-3 py-2.5 rounded-lg border border-[var(--border)]
    bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm
    focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50
    focus:border-[var(--accent)] transition-colors`

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14
            rounded-2xl bg-[var(--accent)] mb-3">
            <span className="font-display font-bold text-white text-xl">M</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            Create Account
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Join the M.E.D.I.C. platform</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20
              text-red-400 text-sm">⚠ {error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Full name
                </label>
                <input type="text" value={form.fullName} onChange={set('fullName')}
                  className={inputClass} placeholder="Dr. Jane Smith" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Username
                </label>
                <input type="text" value={form.username} onChange={set('username')}
                  className={inputClass} placeholder="jsmith" required minLength={3} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Email
              </label>
              <input type="email" value={form.email} onChange={set('email')}
                className={inputClass} placeholder="jane.smith@hospital.cm" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Password
              </label>
              <input type="password" value={form.password} onChange={set('password')}
                className={inputClass} placeholder="Minimum 8 characters" required minLength={8} />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Role
              </label>
              <select value={form.role} onChange={set('role')}
                className={inputClass}>
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Facility ID
                </label>
                <input type="text" value={form.facilityId} onChange={set('facilityId')}
                  className={inputClass} placeholder="FAC-001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Facility name
                </label>
                <input type="text" value={form.facilityName} onChange={set('facilityName')}
                  className={inputClass} placeholder="Yaoundé General Hospital" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 mt-2 rounded-lg font-medium text-sm
                bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--text-secondary)] mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--accent)] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
