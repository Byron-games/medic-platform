import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { ArrowLeft, Wifi, WifiOff, Info } from 'lucide-react'

export default function NewSessionPage() {
  const navigate                      = useNavigate()
  const [searchParams]                = useSearchParams()
  const prefillMpi                    = searchParams.get('patient') ?? ''

  const [form, setForm] = useState({
    patientMpiId:    prefillMpi,
    clinicianId:     '',
    clinicianName:   '',
    appointmentId:   '',
    scheduledAt:     '',
    lowBandwidthMode: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const inputCls = `w-full px-3 py-2.5 rounded-lg border border-[var(--border)]
    bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm
    focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50
    focus:border-[var(--accent)] transition-colors
    placeholder:text-[var(--text-secondary)]`

  const setF = (k: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.patientMpiId.trim()) { setError('Patient MPI ID is required.'); return }
    if (!form.clinicianId.trim())  { setError('Clinician ID is required.');   return }
    if (!form.clinicianName.trim()){ setError('Clinician name is required.');  return }

    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/telemedicine/sessions', {
        patientMpiId:    form.patientMpiId.trim(),
        clinicianId:     parseInt(form.clinicianId),
        clinicianName:   form.clinicianName.trim(),
        appointmentId:   form.appointmentId ? parseInt(form.appointmentId) : null,
        scheduledAt:     form.scheduledAt ? form.scheduledAt + ':00' : null,
        lowBandwidthMode: form.lowBandwidthMode,
      })
      navigate(`/telemedicine/${data.id}`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to create session.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl space-y-5">
      <button
        onClick={() => navigate('/telemedicine')}
        className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]
          hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft size={16} /> Telemedicine
      </button>

      <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
        New Telemedicine Session
      </h1>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20
          text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Participants */}
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

        {/* Optional link + schedule */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <h2 className="font-display text-sm font-semibold text-[var(--text-primary)]">
            Optional
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Appointment ID
              </label>
              <input type="number" value={form.appointmentId} onChange={setF('appointmentId')}
                className={inputCls} placeholder="Links to an appointment" min={1} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Schedule for
              </label>
              <input type="datetime-local" value={form.scheduledAt}
                onChange={setF('scheduledAt')} className={inputCls}
                min={new Date().toISOString().slice(0, 16)} />
            </div>
          </div>
        </div>

        {/* Connectivity */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="font-display text-sm font-semibold text-[var(--text-primary)] mb-3">
            Connectivity
          </h2>

          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, lowBandwidthMode: !f.lowBandwidthMode }))}
            className={`w-full flex items-center gap-3 p-4 rounded-lg border-2
              transition-colors cursor-pointer text-left
              ${form.lowBandwidthMode
                ? 'border-orange-500/50 bg-orange-500/10'
                : 'border-[var(--border)] hover:border-orange-500/30'
              }`}
          >
            <div className={`shrink-0 p-2 rounded-lg
              ${form.lowBandwidthMode ? 'bg-orange-500/20 text-orange-400' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'}`}>
              {form.lowBandwidthMode ? <WifiOff size={18} /> : <Wifi size={18} />}
            </div>
            <div className="flex-1">
              <div className={`text-sm font-medium
                ${form.lowBandwidthMode ? 'text-orange-400' : 'text-[var(--text-primary)]'}`}>
                Low-bandwidth mode
                {form.lowBandwidthMode && <span className="ml-2 text-xs">● Enabled</span>}
              </div>
              <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                Caps video to 240p, disables screen share, enables audio-only fallback.
                Recommended for rural areas with &lt; 1 Mbps connection.
              </div>
            </div>
          </button>

          <div className="flex items-start gap-2 mt-3 text-xs text-[var(--text-secondary)]">
            <Info size={13} className="shrink-0 mt-0.5 text-[var(--accent)]" />
            <span>
              You can toggle bandwidth mode after session creation without
              interrupting the call. The patient will receive an SMS with their join link.
            </span>
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
            {loading ? 'Creating session…' : 'Create session'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/telemedicine')}
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
