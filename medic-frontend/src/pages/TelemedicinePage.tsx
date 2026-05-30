import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Video, PlusCircle, Wifi, WifiOff, AlertCircle, ExternalLink } from 'lucide-react'

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

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  CREATED:   { label: 'Ready',       cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  WAITING:   { label: 'Patient Waiting', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  ACTIVE:    { label: 'In Progress', cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
  ENDED:     { label: 'Ended',       cls: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  CANCELLED: { label: 'Cancelled',   cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
  FAILED:    { label: 'Failed',      cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.CREATED
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}m ${s}s`
}

export default function TelemedicinePage() {
  const [sessions, setSessions]     = useState<TeleSession[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [actionId, setActionId]     = useState<number | null>(null)
  const navigate                    = useNavigate()

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get<TeleSession[]>('/telemedicine/sessions/active')
      setSessions(data)
    } catch {
      setError('Could not load sessions. Is the Telemedicine Service running?')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  // Poll active sessions every 15s so WAITING status updates automatically
  useEffect(() => {
    const interval = setInterval(fetchSessions, 15000)
    return () => clearInterval(interval)
  }, [fetchSessions])

  const doAction = async (id: number, action: string) => {
    setActionId(id)
    try {
      await api.patch(`/telemedicine/sessions/${id}/${action}`)
      fetchSessions()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Action failed'
      setError(msg)
    } finally {
      setActionId(null)
    }
  }

  const toggleBandwidth = async (id: number) => {
    setActionId(id)
    try {
      await api.patch(`/telemedicine/sessions/${id}/toggle-bandwidth`)
      fetchSessions()
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
            Telemedicine
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-0.5">
            {sessions.length} active session{sessions.length !== 1 ? 's' : ''}
            <span className="ml-2 text-xs opacity-60">(refreshes every 15s)</span>
          </p>
        </div>
        <button
          onClick={() => navigate('/telemedicine/new')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg
            bg-[var(--accent)] hover:bg-[var(--accent-hover)]
            text-white text-sm font-medium transition-colors
            shadow-lg shadow-[var(--accent)]/20"
        >
          <PlusCircle size={16} />
          New session
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-4 rounded-xl
          bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Sessions grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--text-secondary)] gap-2">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
          </svg>
          Loading sessions…
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16
          bg-[var(--bg-card)] border border-dashed border-[var(--border)] rounded-xl
          text-[var(--text-secondary)]">
          <Video size={32} className="mb-2 opacity-30" />
          <p className="text-sm">No active telemedicine sessions.</p>
          <button
            onClick={() => navigate('/telemedicine/new')}
            className="mt-3 text-sm text-[var(--accent)] hover:underline"
          >
            Start a new session
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sessions.map(s => {
            const isLoading = actionId === s.id
            const isWaiting = s.status === 'WAITING'
            const isActive  = s.status === 'ACTIVE'
            const canStart  = s.status === 'CREATED' || isWaiting
            const canEnd    = isActive || isWaiting

            return (
              <div key={s.id}
                className={`bg-[var(--bg-card)] border rounded-xl p-5 space-y-4
                  ${isWaiting ? 'border-amber-500/40 shadow-amber-500/10 shadow-lg' :
                    isActive  ? 'border-green-500/40 shadow-green-500/10 shadow-lg' :
                    'border-[var(--border)]'}`}>

                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <StatusBadge status={s.status} />
                      {s.lowBandwidthMode && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5
                          rounded-full text-xs bg-orange-500/10 text-orange-400
                          border border-orange-500/20">
                          <WifiOff size={10} /> Low BW
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xs text-[var(--accent)] font-semibold">
                      {s.sessionCode}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-[var(--text-secondary)]">
                      {new Date(s.createdAt).toLocaleTimeString('en-GB', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                {/* Participants */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-[var(--text-secondary)] mb-0.5">Patient</div>
                    <button
                      onClick={() => navigate(`/patients/${s.patientMpiId}`)}
                      className="font-mono text-xs text-[var(--accent)] hover:underline"
                    >
                      {s.patientMpiId}
                    </button>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-secondary)] mb-0.5">Clinician</div>
                    <div className="text-sm text-[var(--text-primary)]">{s.clinicianName}</div>
                  </div>
                </div>

                {/* Waiting pulse indicator */}
                {isWaiting && (
                  <div className="flex items-center gap-2 text-sm text-amber-400">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    Patient has joined — waiting for clinician
                  </div>
                )}
                {isActive && (
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Call in progress
                  </div>
                )}

                {/* Join URLs */}
                <div className="space-y-2">
                  <a
                    href={s.clinicianJoinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between w-full px-3 py-2
                      rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20
                      text-[var(--accent)] text-xs font-medium
                      hover:bg-[var(--accent)]/20 transition-colors"
                  >
                    <span>Join as clinician</span>
                    <ExternalLink size={12} />
                  </a>
                  <div className="flex items-center justify-between px-3 py-2
                    rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-xs">
                    <span className="text-[var(--text-secondary)]">Patient SMS link</span>
                    <span className="font-mono text-[var(--text-primary)]">{s.sessionCode}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {canStart && (
                    <button
                      onClick={() => doAction(s.id, 'start')}
                      disabled={isLoading}
                      className="px-3 py-1.5 text-xs rounded-lg bg-green-500/10
                        text-green-400 border border-green-500/20
                        hover:bg-green-500/20 transition-colors disabled:opacity-50"
                    >
                      Start call
                    </button>
                  )}
                  {canEnd && (
                    <button
                      onClick={() => doAction(s.id, 'end')}
                      disabled={isLoading}
                      className="px-3 py-1.5 text-xs rounded-lg bg-red-500/10
                        text-red-400 border border-red-500/20
                        hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      End call
                    </button>
                  )}
                  {!isActive && !isWaiting && (
                    <button
                      onClick={() => doAction(s.id, 'cancel')}
                      disabled={isLoading}
                      className="px-3 py-1.5 text-xs rounded-lg
                        text-[var(--text-secondary)] border border-[var(--border)]
                        hover:bg-[var(--border)] transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={() => toggleBandwidth(s.id)}
                    disabled={isLoading}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg
                      text-orange-400 border border-orange-500/20
                      hover:bg-orange-500/10 transition-colors disabled:opacity-50 ml-auto"
                    title="Toggle low-bandwidth mode"
                  >
                    {s.lowBandwidthMode ? <Wifi size={12} /> : <WifiOff size={12} />}
                    {s.lowBandwidthMode ? 'Normal BW' : 'Low BW'}
                  </button>
                  {isLoading && (
                    <svg className="animate-spin h-4 w-4 text-[var(--accent)]"
                      fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                    </svg>
                  )}
                </div>

                {/* Duration (ended) */}
                {s.durationSeconds != null && (
                  <div className="text-xs text-[var(--text-secondary)] pt-1 border-t border-[var(--border)]">
                    Duration: {formatDuration(s.durationSeconds)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
