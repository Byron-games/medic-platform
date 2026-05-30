import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { ArrowLeft, Plus, Trash2, AlertTriangle, Search } from 'lucide-react'

interface Drug { id: number; genericName: string; brandNames: string[]; standardDoses: string[]; dosageForms: string[] }
interface MedLine { name: string; dosage: string; frequency: string; duration: string; quantity: string; instructions: string }
interface Warning { drug1: string; drug2: string; severity: string; description: string }

const FREQ_OPTIONS = [
  'once daily', 'twice daily', 'three times daily', 'four times daily',
  'every 6 hours', 'every 8 hours', 'every 12 hours',
  'once weekly', 'at bedtime', 'as needed'
]

const emptyLine = (): MedLine => ({
  name: '', dosage: '', frequency: 'twice daily', duration: '', quantity: '', instructions: ''
})

const inputCls = `w-full px-3 py-2 rounded-lg border border-[var(--border)]
  bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm
  focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50
  focus:border-[var(--accent)] transition-colors
  placeholder:text-[var(--text-secondary)]`

export default function IssuePrescriptionPage() {
  const navigate              = useNavigate()
  const [searchParams]        = useSearchParams()
  const prefillMpi            = searchParams.get('patient') ?? ''

  const [patientMpi, setMpi]          = useState(prefillMpi)
  const [medications, setMeds]        = useState<MedLine[]>([emptyLine()])
  const [notes, setNotes]             = useState('')
  const [expiryDays, setExpiryDays]   = useState('30')
  const [forceIssue, setForce]        = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [warnings, setWarnings]       = useState<Warning[]>([])
  const [drugResults, setDrugResults] = useState<Drug[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeLineIdx, setActiveIdx] = useState<number | null>(null)

  // Drug search
  useEffect(() => {
    if (searchQuery.length < 2) { setDrugResults([]); return }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get<Drug[]>(`/pharmacy/drugs/search?q=${encodeURIComponent(searchQuery)}`)
        setDrugResults(data.slice(0, 6))
      } catch { /* silently fail */ }
    }, 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  const selectDrug = (drug: Drug, idx: number) => {
    setMeds(prev => prev.map((m, i) => i === idx
      ? { ...m, name: drug.genericName, dosage: drug.standardDoses?.[0] ?? '' }
      : m
    ))
    setDrugResults([])
    setSearchQuery('')
    setActiveIdx(null)
  }

  const setMedField = (idx: number, field: keyof MedLine, value: string) =>
    setMeds(prev => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m))

  const addLine   = () => setMeds(prev => [...prev, emptyLine()])
  const removeLine = (idx: number) => setMeds(prev => prev.filter((_, i) => i !== idx))

  // Live interaction check
  const checkInteractions = async () => {
    const filled = medications.filter(m => m.name.trim())
    if (filled.length < 2) { setWarnings([]); return }
    try {
      const payload = filled.map(m => ({
        name: m.name, dosage: m.dosage, frequency: m.frequency,
        duration: m.duration || null, quantity: m.quantity || null,
        instructions: m.instructions || null
      }))
      const { data } = await api.post<Warning[]>('/pharmacy/interactions/check', payload)
      setWarnings(data)
    } catch { /* silently fail */ }
  }

  useEffect(() => {
    const t = setTimeout(checkInteractions, 800)
    return () => clearTimeout(t)
  }, [medications])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const filled = medications.filter(m => m.name.trim() && m.dosage.trim())
    if (!patientMpi.trim())  { setError('Patient MPI ID is required.'); return }
    if (filled.length === 0) { setError('At least one medication is required.'); return }
    setError('')
    setLoading(true)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + parseInt(expiryDays || '30'))

    try {
      const { data } = await api.post('/pharmacy/prescriptions', {
        patientMpiId: patientMpi.trim(),
        medications: filled.map(m => ({
          name: m.name.trim(), dosage: m.dosage.trim(),
          frequency: m.frequency, duration: m.duration || null,
          quantity: m.quantity || null, instructions: m.instructions || null
        })),
        notes: notes || null,
        expiresAt: expiresAt.toISOString().slice(0, 19),
        forceIssue,
      })
      navigate(`/pharmacy/${data.id}`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string }; status?: number } })
        ?.response?.data?.message ?? 'Failed to issue prescription.'
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 409) {
        setWarnings(prev => {
          if (prev.length === 0) {
            setError(msg + ' Set "Issue anyway" to proceed.')
          }
          return prev
        })
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
      <button onClick={() => navigate('/pharmacy')}
        className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]
          hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft size={16} /> Pharmacy
      </button>

      <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
        Issue Prescription
      </h1>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20
          text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Interaction warnings */}
      {warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <AlertTriangle size={16} />
            Drug interaction{warnings.length > 1 ? 's' : ''} detected
          </div>
          {warnings.map((w, i) => (
            <div key={i} className="text-xs text-amber-300/80">
              <span className="font-semibold">{w.drug1} + {w.drug2}</span>
              {' — '}{w.description}
            </div>
          ))}
          <label className="flex items-center gap-2 text-sm text-amber-300 cursor-pointer mt-2">
            <input
              type="checkbox"
              checked={forceIssue}
              onChange={e => setForce(e.target.checked)}
              className="w-4 h-4 accent-amber-500"
            />
            Issue anyway — I have reviewed the interactions
          </label>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Patient */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="font-display text-sm font-semibold text-[var(--text-primary)] mb-3">
            Patient
          </h2>
          <input type="text" value={patientMpi} onChange={e => setMpi(e.target.value)}
            className={inputCls} placeholder="MPI-20260520-XXXXX" required />
        </div>

        {/* Medications */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-[var(--text-primary)]">
              Medications
            </h2>
            <button type="button" onClick={addLine}
              className="flex items-center gap-1.5 text-xs text-[var(--accent)]
                hover:underline">
              <Plus size={14} /> Add medication
            </button>
          </div>

          {/* Drug search box */}
          <div className="relative">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2
                text-[var(--text-secondary)] pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setActiveIdx(null) }}
                onFocus={() => setActiveIdx(null)}
                placeholder="Search drug catalog to auto-fill…"
                className={inputCls + ' pl-9 text-xs'}
              />
            </div>
            {drugResults.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1
                bg-[var(--bg-card)] border border-[var(--border)] rounded-xl
                shadow-xl overflow-hidden">
                {drugResults.map(drug => (
                  <div key={drug.id} className="px-3 py-2 text-sm cursor-pointer
                    hover:bg-[var(--bg-primary)] transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[var(--text-primary)]">
                        {drug.genericName}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {drug.brandNames?.slice(0, 2).join(', ')}
                      </span>
                    </div>
                    <div className="flex gap-3 mt-0.5">
                      {drug.standardDoses?.map(dose => (
                        <button
                          key={dose}
                          type="button"
                          onClick={() => {
                            const idx = activeLineIdx ?? medications.length - 1
                            selectDrug({ ...drug }, idx)
                            setMeds(prev => prev.map((m, i) =>
                              i === idx ? { ...m, name: drug.genericName, dosage: dose } : m
                            ))
                          }}
                          className="text-xs text-[var(--accent)] hover:underline"
                        >
                          {dose}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {medications.map((med, idx) => (
            <div key={idx}
              className="border border-[var(--border)] rounded-lg p-4 space-y-3
                bg-[var(--bg-primary)]"
              onClick={() => setActiveIdx(idx)}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-secondary)]
                  uppercase tracking-wide">
                  Drug {idx + 1}
                </span>
                {medications.length > 1 && (
                  <button type="button" onClick={() => removeLine(idx)}
                    className="text-[var(--text-secondary)] hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">
                    Drug name *
                  </label>
                  <input type="text" value={med.name}
                    onChange={e => setMedField(idx, 'name', e.target.value)}
                    className={inputCls} placeholder="Generic name" required />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">
                    Dosage *
                  </label>
                  <input type="text" value={med.dosage}
                    onChange={e => setMedField(idx, 'dosage', e.target.value)}
                    className={inputCls} placeholder="500mg" required />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">
                    Frequency *
                  </label>
                  <select value={med.frequency}
                    onChange={e => setMedField(idx, 'frequency', e.target.value)}
                    className={inputCls}>
                    {FREQ_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">
                    Duration
                  </label>
                  <input type="text" value={med.duration}
                    onChange={e => setMedField(idx, 'duration', e.target.value)}
                    className={inputCls} placeholder="5 days" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">
                    Quantity
                  </label>
                  <input type="text" value={med.quantity}
                    onChange={e => setMedField(idx, 'quantity', e.target.value)}
                    className={inputCls} placeholder="10 tablets" />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">
                    Instructions
                  </label>
                  <input type="text" value={med.instructions}
                    onChange={e => setMedField(idx, 'instructions', e.target.value)}
                    className={inputCls} placeholder="Take with food, avoid alcohol…" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Notes + expiry */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-4">
          <h2 className="font-display text-sm font-semibold text-[var(--text-primary)]">
            Additional details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Notes for pharmacist
              </label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                className={inputCls + ' resize-none'} rows={2}
                placeholder="Allergy notes, special instructions…" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Valid for (days)
              </label>
              <input type="number" value={expiryDays}
                onChange={e => setExpiryDays(e.target.value)}
                className={inputCls} min={1} max={365} />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading || (warnings.length > 0 && !forceIssue)}
            className="flex-1 py-2.5 px-4 rounded-lg bg-[var(--accent)]
              hover:bg-[var(--accent-hover)] text-white font-medium text-sm
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              shadow-lg shadow-[var(--accent)]/20">
            {loading ? 'Issuing…' : 'Issue prescription'}
          </button>
          <button type="button" onClick={() => navigate('/pharmacy')}
            className="px-4 py-2.5 rounded-lg border border-[var(--border)]
              text-[var(--text-secondary)] hover:bg-[var(--border)] text-sm transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
