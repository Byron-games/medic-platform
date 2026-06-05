import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { ArrowLeft, Edit2, UserX } from 'lucide-react'

interface PatientResponse {
  id: number
  mpiId: string
  nationalId: string | null
  firstName: string
  lastName: string
  fullName: string
  dateOfBirth: string
  age: number
  gender: string
  bloodType: string | null
  phoneNumber: string | null
  email: string | null
  address: string | null
  region: string | null
  country: string
  primaryFacilityId: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <dt className="text-xs text-[var(--text-secondary)] uppercase tracking-wide font-medium mb-0.5">
        {label}
      </dt>
      <dd className="text-sm text-[var(--text-primary)] font-medium">
        {value != null && value !== ''
          ? value
          : <span className="text-[var(--text-secondary)] font-normal italic">Not recorded</span>
        }
      </dd>
    </div>
  )
}

export default function PatientDetailPage() {
  const { mpiId }                   = useParams<{ mpiId: string }>()
  const [patient, setPatient]       = useState<PatientResponse | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const navigate                    = useNavigate()

  useEffect(() => {
    if (!mpiId) return
    api.get<PatientResponse>(`/patients/${mpiId}`)
      .then(r => setPatient(r.data))
      .catch(() => setError(`Patient '${mpiId}' not found.`))
      .finally(() => setLoading(false))
  }, [mpiId])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-[var(--text-secondary)] gap-2">
      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10"
          stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
      </svg>
      Loading patient record…
    </div>
  )

  if (error || !patient) return (
    <div className="space-y-4">
      <button
        onClick={() => navigate('/patients')}
        className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]
          hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft size={16} /> Back to patients
      </button>
      <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
        {error}
      </div>
    </div>
  )

  const bloodTypeColor: Record<string, string> = {
    'A+': 'text-red-400', 'A-': 'text-red-300',
    'B+': 'text-orange-400', 'B-': 'text-orange-300',
    'O+': 'text-green-400', 'O-': 'text-green-300',
    'AB+': 'text-purple-400', 'AB-': 'text-purple-300',
  }

  return (
    <div className="space-y-5 max-w-3xl">

      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/patients')}
          className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]
            hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft size={16} /> Patients
        </button>
        <button
          onClick={() => navigate(`/patients/${mpiId}/edit`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
            border border-[var(--border)] hover:bg-[var(--border)] transition-colors
            text-[var(--text-primary)]"
        >
          <Edit2 size={14} /> Edit
        </button>
      </div>

      {/* Identity card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-[var(--accent)]/20 flex items-center
            justify-center text-[var(--accent)] font-display font-bold text-xl shrink-0">
            {patient.firstName[0]}{patient.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-xl font-bold text-[var(--text-primary)]">
                {patient.fullName}
              </h1>
              {!patient.active && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                  text-xs bg-red-500/10 text-red-400 border border-red-500/20">
                  <UserX size={10} /> Deactivated
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              <span className="font-mono text-xs text-[var(--accent)] bg-[var(--accent)]/10
                px-2 py-0.5 rounded">
                {patient.mpiId}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                {patient.gender} · {patient.age} years old
              </span>
              {patient.bloodType && (
                <span className={`text-xs font-bold ${bloodTypeColor[patient.bloodType] ?? 'text-red-400'}`}>
                  {patient.bloodType}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Demographics */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
        <h2 className="font-display text-sm font-semibold text-[var(--text-primary)] mb-5">
          Demographics
        </h2>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          <Field label="Date of birth"
            value={new Date(patient.dateOfBirth).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric'
            })} />
          <Field label="National ID"     value={patient.nationalId} />
          <Field label="Phone"           value={patient.phoneNumber} />
          <Field label="Email"           value={patient.email} />
          <Field label="Region"          value={patient.region} />
          <Field label="Country"         value={patient.country} />
          <Field label="Address"         value={patient.address} />
          <Field label="Primary facility" value={patient.primaryFacilityId} />
        </dl>
      </div>

      {/* Audit trail */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
        <h2 className="font-display text-sm font-semibold text-[var(--text-primary)] mb-5">
          Record audit
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Registered"
            value={new Date(patient.createdAt).toLocaleString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })} />
          <Field label="Last updated"
            value={new Date(patient.updatedAt).toLocaleString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })} />
        </dl>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => navigate(`/patients/${mpiId}/records`)}
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4
            text-left hover:border-[var(--accent)]/50 hover:bg-[var(--bg-primary)]
            transition-colors group"
        >
          <p className="text-xs font-semibold text-[var(--accent)] group-hover:underline">
            Medical Records →
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            SOAP notes, vitals, ICD-10
          </p>
        </button>
        <div className="bg-[var(--bg-card)] border border-dashed border-[var(--border)]
          rounded-xl p-4">
          <p className="text-xs font-semibold text-[var(--text-secondary)]">Appointments</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1 opacity-60">Coming Week 5</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-dashed border-[var(--border)]
          rounded-xl p-4">
          <p className="text-xs font-semibold text-[var(--text-secondary)]">Prescriptions</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1 opacity-60">Coming Week 7</p>
        </div>
      </div>
    </div>
  )
}
