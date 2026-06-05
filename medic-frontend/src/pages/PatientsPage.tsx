import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Search, UserPlus, ChevronLeft, ChevronRight, User } from 'lucide-react'

interface PatientSummary {
  mpiId: string
  fullName: string
  firstName: string
  lastName: string
  dateOfBirth: string
  age: number
  gender: string
  phoneNumber: string | null
  nationalId: string | null
  primaryFacilityId: string | null
}

interface SpringPage<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientSummary[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(0)
  const [totalPages, setTotal]  = useState(0)
  const [totalCount, setCount]  = useState(0)
  const [error, setError]       = useState('')
  const navigate                = useNavigate()

  const fetchPatients = useCallback(async (term: string, pg: number) => {
    setLoading(true)
    setError('')
    try {
      const endpoint = term.trim()
        ? `/patients/search?q=${encodeURIComponent(term.trim())}&page=${pg}&size=20`
        : `/patients?page=${pg}&size=20`
      const { data } = await api.get<SpringPage<PatientSummary>>(endpoint)
      setPatients(data.content)
      setTotal(data.totalPages)
      setCount(data.totalElements)
    } catch {
      setError('Failed to load patients. Is the Patient Identity Service running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchPatients(search, page), 300)
    return () => clearTimeout(t)
  }, [search, page, fetchPatients])

  const genderClass = (g: string) => ({
    MALE:    'bg-blue-500/10 text-blue-400',
    FEMALE:  'bg-pink-500/10 text-pink-400',
    OTHER:   'bg-purple-500/10 text-purple-400',
    UNKNOWN: 'bg-gray-500/10 text-gray-400',
  }[g] ?? 'bg-gray-500/10 text-gray-400')

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            Patients
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-0.5">
            {totalCount.toLocaleString()} registered patients
          </p>
        </div>
        <button
          onClick={() => navigate('/patients/new')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg
            bg-[var(--accent)] hover:bg-[var(--accent-hover)]
            text-white text-sm font-medium transition-colors shadow-lg shadow-[var(--accent)]/20"
        >
          <UserPlus size={16} />
          Register patient
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2
          text-[var(--text-secondary)] pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          placeholder="Search by name, national ID, phone or MPI ID…"
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[var(--border)]
            bg-[var(--bg-card)] text-[var(--text-primary)] text-sm
            focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50
            focus:border-[var(--accent)] transition-colors
            placeholder:text-[var(--text-secondary)]"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20
          text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[var(--text-secondary)] gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
            </svg>
            Loading…
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16
            text-[var(--text-secondary)]">
            <User size={32} className="mb-2 opacity-30" />
            <p className="text-sm">
              {search ? 'No patients match your search.' : 'No patients registered yet.'}
            </p>
            {!search && (
              <button
                onClick={() => navigate('/patients/new')}
                className="mt-3 text-sm text-[var(--accent)] hover:underline"
              >
                Register the first patient
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-primary)]">
                  {['MPI ID', 'Patient', 'DOB', 'Age', 'Gender', 'Phone', 'Facility'].map(h => (
                    <th key={h}
                      className="text-left px-4 py-3 text-xs font-semibold
                        text-[var(--text-secondary)] uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {patients.map(p => (
                  <tr
                    key={p.mpiId}
                    onClick={() => navigate(`/patients/${p.mpiId}`)}
                    className="hover:bg-[var(--bg-primary)] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-[var(--accent)]
                      whitespace-nowrap">
                      {p.mpiId}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-[var(--text-primary)]">
                        {p.fullName}
                      </span>
                      {p.nationalId && (
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                          ID: {p.nationalId}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)] whitespace-nowrap">
                      {new Date(p.dateOfBirth).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{p.age}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full
                        text-xs font-medium ${genderClass(p.gender)}`}>
                        {p.gender}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)] font-mono text-xs
                      whitespace-nowrap">
                      {p.phoneNumber ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">
                      {p.primaryFacilityId ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg border border-[var(--border)]
                hover:bg-[var(--border)] disabled:opacity-40
                disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg border border-[var(--border)]
                hover:bg-[var(--border)] disabled:opacity-40
                disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
