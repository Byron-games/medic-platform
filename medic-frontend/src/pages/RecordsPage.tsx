import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import {
  ArrowLeft, PlusCircle, ChevronDown, ChevronRight,
  FileText, AlertCircle, Activity
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────
interface RecordSummary {
  id: number
  patientMpiId: string
  recordType: string
  facilityId: string
  facilityName: string
  clinicianName: string
  visitDate: string
  chiefComplaint: string
  icd10Codes: string[] | null
  networkShared: boolean
}

interface VitalSigns {
  id: number
  recordedAt: string
  temperatureC: number | null
  pulseBpm: number | null
  respiratoryRate: number | null
  systolicBp: number | null
  diastolicBp: number | null
  oxygenSatPct: number | null
  weightKg: number | null
  heightCm: number | null
  bmi: number | null
}

interface FullRecord extends RecordSummary {
  subjective: string | null
  objective: string | null
  assessment: string | null
  plan: string | null
  vitals: VitalSigns[]
  createdAt: string
  updatedAt: string
}

interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
}

// ── Helpers ──────────────────────────────────────────────────
const RECORD_TYPE_COLORS: Record<string, string> = {
  SOAP:       'bg-blue-500/10 text-blue-400 border-blue-500/20',
  ADMISSION:  'bg-purple-500/10 text-purple-400 border-purple-500/20',
  DISCHARGE:  'bg-green-500/10 text-green-400 border-green-500/20',
  EMERGENCY:  'bg-red-500/10 text-red-400 border-red-500/20',
  FOLLOW_UP:  'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  PROCEDURE:  'bg-orange-500/10 text-orange-400 border-orange-500/20',
  LAB_RESULT: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  REFERRAL:   'bg-pink-500/10 text-pink-400 border-pink-500/20',
}

function TypeBadge({ type }: { type: string }) {
  const cls = RECORD_TYPE_COLORS[type] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {type.replace('_', ' ')}
    </span>
  )
}

function VitalRow({ label, value, unit }: { label: string; value?: number | null; unit?: string }) {
  if (value == null) return null
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-[var(--border)] last:border-0">
      <span className="text-xs text-[var(--text-secondary)]">{label}</span>
      <span className="text-xs font-mono font-medium text-[var(--text-primary)]">
        {value}{unit && <span className="text-[var(--text-secondary)] ml-1">{unit}</span>}
      </span>
    </div>
  )
}

function SoapSection({ label, content }: { label: string; content?: string | null }) {
  if (!content) return null
  return (
    <div>
      <dt className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1">
        {label}
      </dt>
      <dd className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
        {content}
      </dd>
    </div>
  )
}

// ── Expanded record panel ────────────────────────────────────
function RecordDetail({ recordId }: { recordId: number }) {
  const [record, setRecord] = useState<FullRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<FullRecord>(`/emr/records/${recordId}`)
      .then(r => setRecord(r.data))
      .finally(() => setLoading(false))
  }, [recordId])

  if (loading) return (
    <div className="p-6 text-center text-[var(--text-secondary)] text-sm">Loading…</div>
  )
  if (!record) return null

  const latestVitals = record.vitals?.[0]

  return (
    <div className="border-t border-[var(--border)] bg-[var(--bg-primary)] p-5 space-y-5">
      {/* SOAP note */}
      <dl className="space-y-4">
        <SoapSection label="S — Subjective"  content={record.subjective} />
        <SoapSection label="O — Objective"   content={record.objective} />
        <SoapSection label="A — Assessment"  content={record.assessment} />
        <SoapSection label="P — Plan"        content={record.plan} />
      </dl>

      {/* Vitals */}
      {latestVitals && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} className="text-[var(--accent)]" />
            <span className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wide">
              Vital Signs
            </span>
            <span className="text-xs text-[var(--text-secondary)] ml-auto">
              {new Date(latestVitals.recordedAt).toLocaleString('en-GB', {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
              })}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-6">
            <div>
              <VitalRow label="Temperature" value={latestVitals.temperatureC} unit="°C" />
              <VitalRow label="Pulse"       value={latestVitals.pulseBpm}     unit="bpm" />
              <VitalRow label="Resp. rate"  value={latestVitals.respiratoryRate} unit="/min" />
              <VitalRow label="SpO₂"        value={latestVitals.oxygenSatPct} unit="%" />
            </div>
            <div>
              {latestVitals.systolicBp != null && latestVitals.diastolicBp != null && (
                <div className="flex items-center justify-between py-1.5 border-b border-[var(--border)]">
                  <span className="text-xs text-[var(--text-secondary)]">Blood pressure</span>
                  <span className="text-xs font-mono font-medium text-[var(--text-primary)]">
                    {latestVitals.systolicBp}/{latestVitals.diastolicBp}
                    <span className="text-[var(--text-secondary)] ml-1">mmHg</span>
                  </span>
                </div>
              )}
              <VitalRow label="Weight" value={latestVitals.weightKg} unit="kg" />
              <VitalRow label="Height" value={latestVitals.heightCm} unit="cm" />
              <VitalRow label="BMI"    value={latestVitals.bmi} />
            </div>
          </div>
        </div>
      )}

      {/* ICD-10 codes */}
      {record.icd10Codes && record.icd10Codes.length > 0 && (
        <div>
          <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
            ICD-10 Codes
          </span>
          <div className="flex flex-wrap gap-2 mt-2">
            {record.icd10Codes.map(code => (
              <span key={code}
                className="px-2 py-0.5 rounded font-mono text-xs
                  bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {code}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] pt-1">
        <span>Facility: {record.facilityName}</span>
        <span>Clinician: {record.clinicianName}</span>
        {record.networkShared && (
          <span className="text-green-400">● Shared across network</span>
        )}
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────
export default function RecordsPage() {
  const { mpiId }                     = useParams<{ mpiId: string }>()
  const [records, setRecords]         = useState<RecordSummary[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [expanded, setExpanded]       = useState<number | null>(null)
  const [page, setPage]               = useState(0)
  const [totalPages, setTotalPages]   = useState(0)
  const [totalCount, setTotalCount]   = useState(0)
  const navigate                      = useNavigate()

  const fetchRecords = useCallback(async (pg: number) => {
    if (!mpiId) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get<SpringPage<RecordSummary>>(
        `/emr/patients/${mpiId}/records?page=${pg}&size=10`
      )
      setRecords(data.content)
      setTotalPages(data.totalPages)
      setTotalCount(data.totalElements)
    } catch {
      setError('Could not load medical records. Is the EMR service running?')
    } finally {
      setLoading(false)
    }
  }, [mpiId])

  useEffect(() => { fetchRecords(page) }, [page, fetchRecords])

  const toggle = (id: number) => setExpanded(e => e === id ? null : id)

  return (
    <div className="space-y-5 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/patients/${mpiId}`)}
            className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]
              hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft size={16} />
            Patient
          </button>
          <span className="text-[var(--border)]">/</span>
          <h1 className="font-display text-xl font-bold text-[var(--text-primary)]">
            Medical Records
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--text-secondary)]">
            {totalCount} record{totalCount !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => navigate(`/patients/${mpiId}/records/new`)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg
              bg-[var(--accent)] hover:bg-[var(--accent-hover)]
              text-white text-sm font-medium transition-colors
              shadow-lg shadow-[var(--accent)]/20"
          >
            <PlusCircle size={15} />
            New record
          </button>
        </div>
      </div>

      {/* Patient MPI context pill */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg
        bg-[var(--bg-card)] border border-[var(--border)]">
        <span className="text-xs text-[var(--text-secondary)]">Patient</span>
        <span className="font-mono text-xs text-[var(--accent)]">{mpiId}</span>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-4 rounded-xl
          bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Records timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--text-secondary)] gap-2">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
          </svg>
          Loading records…
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16
          bg-[var(--bg-card)] border border-dashed border-[var(--border)] rounded-xl
          text-[var(--text-secondary)]">
          <FileText size={32} className="mb-2 opacity-30" />
          <p className="text-sm">No medical records for this patient yet.</p>
          <button
            onClick={() => navigate(`/patients/${mpiId}/records/new`)}
            className="mt-3 text-sm text-[var(--accent)] hover:underline"
          >
            Create the first record
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map(r => (
            <div key={r.id}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">

              {/* Record header — click to expand */}
              <button
                onClick={() => toggle(r.id)}
                className="w-full text-left px-5 py-4 flex items-start gap-4
                  hover:bg-[var(--bg-primary)] transition-colors"
              >
                {/* Expand icon */}
                <span className="mt-0.5 text-[var(--text-secondary)] shrink-0">
                  {expanded === r.id
                    ? <ChevronDown size={16} />
                    : <ChevronRight size={16} />
                  }
                </span>

                {/* Date column */}
                <div className="w-24 shrink-0">
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    {new Date(r.visitDate).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short'
                    })}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {new Date(r.visitDate).getFullYear()}
                  </div>
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <TypeBadge type={r.recordType} />
                    {r.icd10Codes && r.icd10Codes.length > 0 && (
                      <span className="text-xs font-mono text-amber-400">
                        {r.icd10Codes.slice(0, 2).join(', ')}
                        {r.icd10Codes.length > 2 && ` +${r.icd10Codes.length - 2}`}
                      </span>
                    )}
                    {r.networkShared && (
                      <span className="text-xs text-green-400">● Shared</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {r.chiefComplaint}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {r.clinicianName} · {r.facilityName}
                  </p>
                </div>
              </button>

              {/* Expanded SOAP + vitals */}
              {expanded === r.id && <RecordDetail recordId={r.id} />}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)]
                hover:bg-[var(--border)] disabled:opacity-40
                disabled:cursor-not-allowed transition-colors text-xs"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)]
                hover:bg-[var(--border)] disabled:opacity-40
                disabled:cursor-not-allowed transition-colors text-xs"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
