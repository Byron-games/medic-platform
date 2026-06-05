import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { ArrowLeft, AlertTriangle } from 'lucide-react'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN']
const CAMEROON_REGIONS = [
  'Adamaoua', 'Centre', 'Est', 'Extrême-Nord', 'Littoral',
  'Nord', 'Nord-Ouest', 'Ouest', 'Sud', 'Sud-Ouest'
]

interface FormState {
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  nationalId: string
  bloodType: string
  phoneNumber: string
  email: string
  address: string
  region: string
  country: string
  primaryFacilityId: string
  forceCreate: boolean
}

export default function RegisterPatientPage() {
  const [form, setForm] = useState<FormState>({
    firstName: '', lastName: '', dateOfBirth: '', gender: 'MALE',
    nationalId: '', bloodType: '', phoneNumber: '', email: '',
    address: '', region: '', country: 'Cameroon',
    primaryFacilityId: '', forceCreate: false,
  })
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [duplicateWarning, setDup]    = useState('')
  const navigate                      = useNavigate()

  const set = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const inputClass = `w-full px-3 py-2.5 rounded-lg border border-[var(--border)]
    bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm
    focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50
    focus:border-[var(--accent)] transition-colors
    placeholder:text-[var(--text-secondary)]`

  const handleSubmit = async (e: React.FormEvent, force = false) => {
    e.preventDefault()
    setError('')
    setDup('')
    setLoading(true)

    const payload = {
      ...form,
      forceCreate: force || form.forceCreate,
      bloodType: form.bloodType || null,
      nationalId: form.nationalId || null,
      phoneNumber: form.phoneNumber || null,
      email: form.email || null,
      address: form.address || null,
      region: form.region || null,
      primaryFacilityId: form.primaryFacilityId || null,
    }

    try {
      const { data } = await api.post('/patients', payload)
      navigate(`/patients/${data.mpiId}`)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string }; status?: number } }
      const msg = e?.response?.data?.message ?? 'Failed to register patient.'
      if (e?.response?.status === 409 && msg.includes('Possible duplicate')) {
        setDup(msg)
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-5">

      {/* Back */}
      <button
        onClick={() => navigate('/patients')}
        className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]
          hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft size={16} /> Patients
      </button>

      <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
        Register new patient
      </h1>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Duplicate warning */}
      {duplicateWarning && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-3">
          <div className="flex items-start gap-2 text-amber-400">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Possible duplicate patient detected</p>
              <p className="text-xs mt-1 text-amber-300/80">{duplicateWarning}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={e => handleSubmit(e as unknown as React.FormEvent, true)}
              disabled={loading}
              className="px-4 py-2 text-sm rounded-lg bg-amber-500 hover:bg-amber-600
                text-white font-medium transition-colors disabled:opacity-50"
            >
              Register anyway
            </button>
            <button
              onClick={() => setDup('')}
              className="px-4 py-2 text-sm rounded-lg border border-[var(--border)]
                text-[var(--text-secondary)] hover:bg-[var(--border)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}
        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 space-y-6">

        {/* Personal info */}
        <div>
          <h2 className="font-display text-sm font-semibold text-[var(--text-primary)] mb-4">
            Personal information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                First name <span className="text-red-400">*</span>
              </label>
              <input type="text" value={form.firstName} onChange={set('firstName')}
                className={inputClass} placeholder="Jean" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Last name <span className="text-red-400">*</span>
              </label>
              <input type="text" value={form.lastName} onChange={set('lastName')}
                className={inputClass} placeholder="Dupont" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Date of birth <span className="text-red-400">*</span>
              </label>
              <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')}
                className={inputClass} required max={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Gender <span className="text-red-400">*</span>
              </label>
              <select value={form.gender} onChange={set('gender')} className={inputClass} required>
                {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                National ID
              </label>
              <input type="text" value={form.nationalId} onChange={set('nationalId')}
                className={inputClass} placeholder="e.g. 123456789" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Blood type
              </label>
              <select value={form.bloodType} onChange={set('bloodType')} className={inputClass}>
                <option value="">Unknown</option>
                {BLOOD_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h2 className="font-display text-sm font-semibold text-[var(--text-primary)] mb-4">
            Contact details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Phone number
              </label>
              <input type="tel" value={form.phoneNumber} onChange={set('phoneNumber')}
                className={inputClass} placeholder="+237 6XX XXX XXX" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Email
              </label>
              <input type="email" value={form.email} onChange={set('email')}
                className={inputClass} placeholder="patient@example.cm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Address
              </label>
              <textarea value={form.address} onChange={set('address')}
                className={inputClass + ' resize-none'} rows={2}
                placeholder="Street, quarter, city…" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Region
              </label>
              <select value={form.region} onChange={set('region')} className={inputClass}>
                <option value="">Select region</option>
                {CAMEROON_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Country
              </label>
              <input type="text" value={form.country} onChange={set('country')}
                className={inputClass} placeholder="Cameroon" />
            </div>
          </div>
        </div>

        {/* Facility */}
        <div>
          <h2 className="font-display text-sm font-semibold text-[var(--text-primary)] mb-4">
            Facility
          </h2>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Primary facility ID
            </label>
            <input type="text" value={form.primaryFacilityId} onChange={set('primaryFacilityId')}
              className={inputClass} placeholder="FAC-001 (defaults to your facility)" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-lg bg-[var(--accent)]
              hover:bg-[var(--accent-hover)] text-white font-medium text-sm
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              shadow-lg shadow-[var(--accent)]/20"
          >
            {loading ? 'Registering…' : 'Register patient'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="px-4 py-2.5 rounded-lg border border-[var(--border)]
              text-[var(--text-secondary)] hover:bg-[var(--border)]
              text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
