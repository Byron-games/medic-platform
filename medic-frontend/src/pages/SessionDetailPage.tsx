import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import {
  ArrowLeft, ExternalLink, Copy, CheckCheck,
  Wifi, WifiOff, Video, Clock, AlertCircle
} from 'lucide-react'

interface TeleSession {
  id: number
  sessionCode: string
  patientMpiId: string
  clinicianId: number
  clinicianName: string
  facilityId: string
  status: string
  platform: string
  roomName: string
  clinicianJoinUrl: string
  patientJoinUrl: string
  lowBandwidthMode: boolean
  scheduledAt: string | null
  startedAt: string | null
  endedAt: string | null
  durationSeconds: number | null
  createdAt: string
}

const STATUS_STEPS = [
  { key: 'CREATED',   label: 'Session created' },
  { key: 'WAITING',   label: 'Patient joined' },
  { key: 'ACTIVE',    label: 'Call in progress' },
  { key: 'ENDED',     label: 'Call ended' },
]

const STATUS_ORDER: Record<string, number> = {
  CREATED: 0, WAITING: 1, ACTIVE: 2, ENDED: 3, CANCELLED: -1, FAILED: -1
}

function formatDuration(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}h ${m}m ${s}s`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <dt className="text-xs text-[var(--text-secondary)] uppercase tracking-wide mb-0.5">
        {label}
      </dt>
      <dd className="text-sm text-[var(--text-primary)] font-medium">
        {value ?? <span className="text-[var(--text-secondary)] font-normal italic">—</span>}
      </dd>
    </div>
  )
}

export default function SessionDetailPage() {
  const { id }                          = useParams<{ id: string }>()
  const [session, setSession]           = useState<TeleSession | null>(null)
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [actionLoading, setActionLoad]  = useState(false)
  const [copied, setCopied]             = useState(false)
  const navigate                        = useNavigate()

  const fetchSession = useCallback(async () => {
    if (!id) return
    try {
      const { data } = await api.get<TeleSession>(`/telemedicine/sessions/${id}`)
      setSession(data)
    } catch {
      setError('Session not found.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchSession() }, [fetchSession])

  // Poll every 10s while session is active or waiting
  useEffect(() => {
    if (!session) return
    if (session.status === 'ACTIVE' || session.status === 'WAITING' || session.status === 'CREATED') {
      const t = setInterval(fetchSession, 10000)
      return () => clearInterval(t)
    }
  }, [session, fetchSession])

  const doAction = async (action: string) => {
    if (!id) return
    setActionLoad(true)
    try {
      await api.patch(`/telemedicine/sessions/${id}/${action}`)
      fetchSession()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Action failed.'
      setError(msg)
    } finally {
      setActionLoad(false)
    }
  }

  const copyCode = () => {
    if (!session) return
    navigator.clipboard.writeText(session.sessionCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-[var(--text-secondary)] gap-2">
      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10"
          stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
      </svg>
      Loading session…
    </div>
  )

  if (error || !session) return (
    <div className="space-y-4 max-w-2xl">
      <button onClick={() => navigate('/telemedicine')}
        className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]
          hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft size={16} /> Telemedicine
      </button>
      <div className="p-5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
        {error || 'Session not found.'}
      </div>
    </div>
  )

  const currentStep = STATUS_ORDER[session.status] ?? 0
  const isCancelled = session.status === 'CANCELLED' || session.status === 'FAILED'
  const canStart    = session.status === 'CREATED' || session.status === 'WAITING'
  const canEnd      = session.status === 'ACTIVE' || session.status === 'WAITING'
  const canCancel   = session.status === 'CREATED' || session.status === 'WAITING'

  return (
    <div className="max-w-2xl space-y-5">

      {/* Back */}
      <button onClick={() => navigate('/telemedicine')}
        className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]
          hover:text-[var(--text-primary)] transition-colors">
        <ArrowLeft size={16} /> Telemedicine
      </button>

      {/* Header card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Video size={18} className="text-[var(--accent)]" />
              <h1 className="font-display text-xl font-bold text-[var(--text-primary)]">
                {session.sessionCode}
              </h1>
              <button onClick={copyCode}
                className="text-[var(--text-secondary)] hover:text-[var(--accent)]
                  transition-colors" title="Copy session code">
                {copied ? <CheckCheck size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {session.platform} · {session.facilityId}
              {session.lowBandwidthMode && (
                <span className="ml-2 text-orange-400 inline-flex items-center gap-1">
                  <WifiOff size={10} /> Low-bandwidth
                </span>
              )}
            </p>
          </div>
          <div className="shrink-0 text-right text-xs text-[var(--text-secondary)]">
            {new Date(session.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric'
            })}
          </div>
        </div>

        {/* Progress stepper */}
        {!isCancelled && (
          <div className="flex items-center gap-0 mt-5">
            {STATUS_STEPS.map((step, i) => {
              const done    = i <= currentStep
              const current = i === currentStep
              const isLast  = i === STATUS_STEPS.length - 1
              return (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center
                      text-xs font-bold border-2 transition-colors
                      ${done
                        ? current && session.status !== 'ENDED'
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                          : 'border-green-500 bg-green-500 text-white'
                        : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)]'
                      }`}>
                      {done && !current ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs whitespace-nowrap
                      ${done ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                      {step.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div className={`flex-1 h-0.5 mb-5 mx-1
                      ${i < currentStep ? 'bg-green-500' : 'bg-[var(--border)]'}`} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {isCancelled && (
          <div className="flex items-center gap-2 mt-4 text-sm text-red-400">
            <AlertCircle size={16} />
            Session {session.status.toLowerCase()}
          </div>
        )}
      </div>

      {/* Join URLs */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 space-y-3">
        <h2 className="font-display text-sm font-semibold text-[var(--text-primary)]">
          Join links
        </h2>
        <a
          href={session.clinicianJoinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between w-full px-4 py-3
            rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/30
            text-[var(--accent)] font-medium text-sm
            hover:bg-[var(--accent)]/20 transition-colors"
        >
          <span>Join as clinician (opens Jitsi)</span>
          <ExternalLink size={14} />
        </a>
        <div className="px-4 py-3 rounded-lg bg-[var(--bg-primary)]
          border border-[var(--border)] space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Patient join code (share via SMS)
            </span>
            <button onClick={copyCode}
              className="flex items-center gap-1 text-xs text-[var(--accent)]
                hover:underline">
              {copied ? <CheckCheck size={12} /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="font-mono text-lg font-bold tracking-widest text-[var(--text-primary)]">
            {session.sessionCode}
          </div>
          <div className="text-xs text-[var(--text-secondary)]">
            Patient opens:{' '}
            <span className="font-mono">
              {window.location.origin}/api/v1/telemedicine/join/{session.sessionCode}
            </span>
          </div>
        </div>
      </div>

      {/* Session details */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
        <h2 className="font-display text-sm font-semibold text-[var(--text-primary)] mb-4">
          Session details
        </h2>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Patient MPI" value={session.patientMpiId} />
          <Field label="Clinician"   value={session.clinicianName} />
          <Field label="Status"      value={session.status} />
          <Field label="Scheduled"
            value={session.scheduledAt
              ? new Date(session.scheduledAt).toLocaleString('en-GB')
              : 'Immediate'} />
          <Field label="Started"
            value={session.startedAt
              ? new Date(session.startedAt).toLocaleString('en-GB')
              : null} />
          <Field label="Ended"
            value={session.endedAt
              ? new Date(session.endedAt).toLocaleString('en-GB')
              : null} />
          {session.durationSeconds != null && (
            <div className="col-span-2 sm:col-span-3 flex items-center gap-2">
              <Clock size={14} className="text-[var(--accent)]" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                Duration: {formatDuration(session.durationSeconds)}
              </span>
            </div>
          )}
        </dl>
      </div>

      {/* Actions */}
      {!isCancelled && session.status !== 'ENDED' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <h2 className="font-display text-sm font-semibold text-[var(--text-primary)] mb-4">
            Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            {canStart && (
              <button
                onClick={() => doAction('start')}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg
                  bg-green-500/10 text-green-400 border border-green-500/20
                  hover:bg-green-500/20 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                Start call
              </button>
            )}
            {canEnd && (
              <button
                onClick={() => doAction('end')}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg
                  bg-red-500/10 text-red-400 border border-red-500/20
                  hover:bg-red-500/20 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                End call
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => doAction('cancel')}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg text-[var(--text-secondary)]
                  border border-[var(--border)] hover:bg-[var(--border)]
                  transition-colors disabled:opacity-50 text-sm"
              >
                Cancel session
              </button>
            )}
            <button
              onClick={() => doAction('toggle-bandwidth')}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg
                text-orange-400 border border-orange-500/20
                hover:bg-orange-500/10 transition-colors disabled:opacity-50 text-sm ml-auto"
            >
              {session.lowBandwidthMode
                ? <><Wifi size={14} /> Switch to normal bandwidth</>
                : <><WifiOff size={14} /> Switch to low bandwidth</>
              }
            </button>
          </div>
          {actionLoading && (
            <p className="text-xs text-[var(--text-secondary)] mt-3 flex items-center gap-2">
              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
              </svg>
              Processing…
            </p>
          )}
          {error && (
            <p className="text-xs text-red-400 mt-3">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}
