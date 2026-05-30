import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { ArrowLeft, Plus, Minus } from 'lucide-react'

const RECORD_TYPES = [
  'SOAP', 'ADMISSION', 'DISCHARGE', 'EMERGENCY',
  'FOLLOW_UP', 'PROCEDURE', 'LAB_RESULT', 'REFERRAL'
]

interface VitalsState {
  temperatureC: string
  pulseBpm: string
  respiratoryRate: string
  systolicBp: string
  diastolicBp: string
  oxygenSatPct: string
  weightKg: string
  heightCm: string
  notes: string
}

interface FormState {
  recordType: string
  visitDate: string
  chiefComplaint: string
  subjective: string
  objective: string
  assessment: string
  plan: string
  icd10CodesRaw: string   // comma-separated input
  networkShared: boolean
}

const emptyVitals = (): VitalsState => ({
  temperatureC: '', pulseBpm: '', respiratoryRate: '',
  systolicBp: '', diastolicBp: '', oxygenSatPct: '',
  weightKg: '', heightCm: '', notes: '',
})

function toNum(s: string): number | null {
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

export default function NewRecordPage() {
  const { mpiId }             = useParams<{ mpiId: string }>()
  const navigate              = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [showVitals, setShowVitals] = useState(false)
  const [vitals, setVitals]   = useState<VitalsState>(emptyVitals())

  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())

  const [form, setForm] = useState<FormState>({
    recordType: 'SOAP',
    visitDate: now.toISOString().slice(0, 16),
    chiefComplaint: '',
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    icd10CodesRaw: '',
    networkShared: false,
  })

  const setF = (k: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  const setV = (k: keyof VitalsState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setVitals(v => ({ ...v, [k]: e.target.value }))

  const inputCls = `w-full px-3 py-2.5 rounded-lg border border-[var(--border)]
    bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm
    focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50
    focus:border-[var(--accent)] transition-colors
    placeholder:text-[var(--text-secondary)]`

  const textAreaCls = `${inputCls} resize-none leading-relaxed`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.chiefComplaint.trim()) {
      setError('Chief complaint is required.')
      return
    }
    setError('')
    setLoading(true)

    const icd10Codes = form.icd10CodesRaw
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(Boolean)

    const vitalsPayload = showVitals ? {
      temperatureC:    toNum(vitals.temperatureC),
      pulseBpm:        toNum(vitals.pulseBpm) ? Math.round(toNum(vitals.pulseBpm)!) : null,
      respiratoryRate: toNum(vitals.respiratoryRate) ? Math.round(toNum(vitals.respiratoryRate)!) : null,
      systolicBp:      toNum(vitals.systolicBp) ? Math.round(toNum(vitals.systolicBp)!) : null,
      diastolicBp:     toNum(vitals.diastolicBp) ? Math.round(toNum(vitals.diastolicBp)!) : null,
      oxygenSatPct:    toNum(vitals.oxygenSatPct),
      weightKg:        toNum(vitals.weightKg),
      heightCm:        toNum(vitals.heightCm),
      notes:           vitals.notes || null,
    } : null

    const payload = {
      patientMpiId:   mpiId,
      recordType:     form.recordType,
      visitDate:      form.visitDate + ':00',
      chiefComplaint: form.chiefComplaint,
      subjective:     form.subjective  || null,
      objective:      form.objective   || null,
      assessment:     form.assessment  || null,
      plan:           form.plan        || null,
      icd10Codes:     icd10Codes.length > 0 ? icd10Codes : null,
      networkShared:  form.networkShared,
      vitals:         vitalsPayload,
    }

    try {
      const { data } = await api.post('/emr/records', payload)
      navigate(`/patients/${mpiId}/records`)
      // Small delay so the list refreshes properly
      setTimeout(() => navigate(`/patients/${mpiId}/records`), 100)
      void data
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Failed to save record.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-5">

      {/* Back */}
      <button
        onClick={() => navigate(`/patients/${mpiId}/records`)}
        className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]
          hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft size={16} /> Medical Records
      </button>

      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          New Medical Record
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1 font-mono">{mpiId}</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20
          text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Meta */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <h2 className="font-display text-sm font-semibold text-[var(--text-primary)]">
            Encounter details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Record type
              </label>
              <select value={form.recordType} onChange={setF('recordType')} className={inputCls}>
                {RECORD_TYPES.map(t => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Visit date & time <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.visitDate}
                onChange={setF('visitDate')}
                className={inputCls}
                required
                max={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Chief complaint <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.chiefComplaint}
              onChange={setF('chiefComplaint')}
              className={inputCls}
              placeholder="e.g. Fever and headache for 3 days"
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="networkShared"
              checked={form.networkShared}
              onChange={e => setForm(f => ({ ...f, networkShared: e.target.checked }))}
              className="w-4 h-4 rounded accent-[var(--accent)]"
            />
            <label htmlFor="networkShared" className="text-sm text-[var(--text-secondary)]">
              Share this record across the M.E.D.I.C. network
              <span className="text-xs ml-1 text-[var(--text-secondary)] opacity-70">
                (visible to other facilities and analytics)
              </span>
            </label>
          </div>
        </div>

        {/* SOAP note */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <h2 className="font-display text-sm font-semibold text-[var(--text-primary)]">
            SOAP Note
          </h2>

          {[
            { key: 'subjective',  label: 'S — Subjective',  hint: 'Patient-reported symptoms, history, HPI…' },
            { key: 'objective',   label: 'O — Objective',   hint: 'Examination findings, observations…' },
            { key: 'assessment',  label: 'A — Assessment',  hint: 'Diagnosis, clinical impression…' },
            { key: 'plan',        label: 'P — Plan',        hint: 'Treatment, medications, referrals, follow-up…' },
          ].map(({ key, label, hint }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-[var(--accent)]
                uppercase tracking-wider mb-1.5">
                {label}
              </label>
              <textarea
                value={form[key as keyof FormState] as string}
                onChange={setF(key as keyof FormState)}
                className={textAreaCls}
                rows={3}
                placeholder={hint}
              />
            </div>
          ))}
        </div>

        {/* ICD-10 */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="font-display text-sm font-semibold text-[var(--text-primary)] mb-3">
            ICD-10 Diagnosis Codes
          </h2>
          <input
            type="text"
            value={form.icd10CodesRaw}
            onChange={setF('icd10CodesRaw')}
            className={inputCls}
            placeholder="e.g. A09, J06.9, B54 (comma-separated)"
          />
          {form.icd10CodesRaw.trim() && (
            <div className="flex flex-wrap gap-2 mt-3">
              {form.icd10CodesRaw.split(',').map(c => c.trim().toUpperCase()).filter(Boolean).map(code => (
                <span key={code}
                  className="px-2 py-0.5 rounded font-mono text-xs
                    bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {code}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Vitals — toggle section */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <button
            type="button"
            onClick={() => setShowVitals(v => !v)}
            className="flex items-center gap-2 text-sm font-semibold
              text-[var(--text-primary)] w-full text-left"
          >
            {showVitals
              ? <Minus size={16} className="text-[var(--accent)]" />
              : <Plus size={16} className="text-[var(--accent)]" />
            }
            Vital Signs
            {!showVitals && (
              <span className="text-xs text-[var(--text-secondary)] font-normal ml-1">
                (click to add)
              </span>
            )}
          </button>

          {showVitals && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { key: 'temperatureC',    label: 'Temp (°C)',    hint: '37.2' },
                { key: 'pulseBpm',        label: 'Pulse (bpm)',  hint: '72' },
                { key: 'respiratoryRate', label: 'Resp. rate',   hint: '16' },
                { key: 'systolicBp',      label: 'Systolic BP',  hint: '120' },
                { key: 'diastolicBp',     label: 'Diastolic BP', hint: '80' },
                { key: 'oxygenSatPct',    label: 'SpO₂ (%)',     hint: '98.5' },
                { key: 'weightKg',        label: 'Weight (kg)',  hint: '70.0' },
                { key: 'heightCm',        label: 'Height (cm)',  hint: '175.0' },
              ].map(({ key, label, hint }) => (
                <div key={key}>
                  <label className="block text-xs font-medium
                    text-[var(--text-secondary)] mb-1.5">
                    {label}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={vitals[key as keyof VitalsState]}
                    onChange={setV(key as keyof VitalsState)}
                    className={inputCls}
                    placeholder={hint}
                  />
                </div>
              ))}
              <div className="col-span-2 sm:col-span-3">
                <label className="block text-xs font-medium
                  text-[var(--text-secondary)] mb-1.5">
                  Vitals notes
                </label>
                <textarea
                  value={vitals.notes}
                  onChange={setV('notes')}
                  className={textAreaCls}
                  rows={2}
                  placeholder="Any additional observations…"
                />
              </div>
            </div>
          )}
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
            {loading ? 'Saving…' : 'Save record'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/patients/${mpiId}/records`)}
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
