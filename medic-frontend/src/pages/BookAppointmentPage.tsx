import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { ArrowLeft } from 'lucide-react'

const APPT_TYPES = [
  { value: 'IN_PERSON',    label: 'In Person' },
  { value: 'TELEMEDICINE', label: 'Telemedicine (Video)' },
  { value: 'HOME_VISIT',   label: 'Home Visit' },
  { value: 'EMERGENCY',    label: 'Emergency' },
]

const DURATIONS = [10, 15, 20, 30, 45, 60, 90, 120]

interface FormState {
  patientMpiId: string
  clinicianId: string
  clinicianName: string
  appointmentType: string
  scheduledAt: string
  durationMinutes: number
  reason: string
  notes: string
}

export default function BookAppointmentPage() {
  const navigate                      = useNavigate()
  const [searchParams]                = useSearchParams()
  const prefillMpi                    = searchParams.get('patient') ?? ''

  // Tomorrow 09:00 as default
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)
  tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset())

  const [form, setForm] = useState<FormState>({
    patientMpiId:    prefillMpi,
    clinicianId:     '',
    clinicianName:   '',
    appointmentType: 'IN_PERSON',
    scheduledAt:     tomorrow.toISOString().slice(0, 16),
    durationMinutes: 30,
    reason:          '',
    notes:           '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const setF = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const inputCls = `w-full px-3 py-2.5 rounded-lg border border-[var(--border)]
    bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm
    focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50
    focus:border-[var(--accent)] transition-colors
    placeholder:text-[var(--text-secondary)]`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.patientMpiId.trim()) { setError('Patient MPI ID is required.'); return }
    if (!form.clinicianId.trim())  { setError('Clinician ID is required.');   return }
    if (!form.clinicianName.trim()){ setError('Clinician name is required.');  return }
    if (!form.reason.trim())       { setError('Reason is required.');          return }

    setLoading(true)
    try {
      const { data } = await api.post('/appointments', {
        patientMpiId:    form.patientMpiId.trim(),
        clinicianId:     parseInt(form.clinicianId),
        clinicianName:   form.clinicianName.trim(),
        appointmentType: form.appointmentType,
        scheduledAt:     form.scheduledAt + ':00',
        durationMinutes: form.durationMinutes,
        reason:          form.reason.trim(),
        notes:           form.notes.trim() || null,
      })
      navigate(`/appointments/${data.id}`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to book appointment.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-5">

      {/* Back */}
      <button
        onClick={() => navigate('/appointments')}
        className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]
          hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft size={16} /> Appointments
      </button>

      <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
        Book Appointment
      </h1>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20
          text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Patient + Clinician */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <h2 className="font-display text-sm font-semibold text-[var(--text-primary)]">
            Participants
          </h2>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Patient MPI ID <span className="text-red-400">*</span>
            </label>
            <input type="text" value={form.patientMpiId} onChange={setF('patientMpiId')}
              className={inputCls} placeholder="MPI-20260520-XXXXX" required />
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Find MPI IDs on the{' '}
              <button type="button" onClick={() => navigate('/patients')}
                className="text-[var(--accent)] hover:underline">
                Patients page
              </button>
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Clinician ID <span className="text-red-400">*</span>
              </label>
              <input type="number" value={form.clinicianId} onChange={setF('clinicianId')}
                className={inputCls} placeholder="e.g. 1" required min={1} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Clinician name <span className="text-red-400">*</span>
              </label>
              <input type="text" value={form.clinicianName} onChange={setF('clinicianName')}
                className={inputCls} placeholder="Dr. Jane Smith" required />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <h2 className="font-display text-sm font-semibold text-[var(--text-primary)]">
            Schedule
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Date & time <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={setF('scheduledAt')}
                className={inputCls}
                required
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Duration
              </label>
              <select value={form.durationMinutes}
                onChange={e => setForm(f => ({ ...f, durationMinutes: parseInt(e.target.value) }))}
                className={inputCls}>
                {DURATIONS.map(d => (
                  <option key={d} value={d}>
                    {d < 60 ? `${d} minutes` : `${d / 60} hour${d > 60 ? 's' : ''}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Appointment type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {APPT_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, appointmentType: t.value }))}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors
                    ${form.appointmentType === t.value
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reason */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <h2 className="font-display text-sm font-semibold text-[var(--text-primary)]">
            Details
          </h2>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Reason for appointment <span className="text-red-400">*</span>
            </label>
            <input type="text" value={form.reason} onChange={setF('reason')}
              className={inputCls}
              placeholder="e.g. Malaria follow-up, routine check-up…"
              required />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Notes (optional)
            </label>
            <textarea value={form.notes} onChange={setF('notes')}
              className={`${inputCls} resize-none`} rows={3}
              placeholder="Any additional instructions or context for the clinician…" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-lg bg-[var(--accent)]
              hover:bg-[var(--accent-hover)] text-white font-medium text-sm
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              shadow-lg shadow-[var(--accent)]/20"
          >
            {loading ? 'Booking…' : 'Book appointment'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/appointments')}
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
