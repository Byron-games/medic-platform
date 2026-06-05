import { useAuthStore } from '../store/authStore'
import { Activity, Users, Calendar, AlertTriangle } from 'lucide-react'

const SERVICES = [
  { name: 'API Gateway',        port: 8080, status: 'checking' },
  { name: 'Auth Service',       port: 8087, status: 'checking' },
  { name: 'Patient Identity',   port: 8081, status: 'checking' },
  { name: 'EMR Service',        port: 8082, status: 'checking' },
  { name: 'Appointments',       port: 8083, status: 'checking' },
  { name: 'Telemedicine',       port: 8084, status: 'checking' },
  { name: 'Pharmacy',           port: 8085, status: 'checking' },
  { name: 'Analytics',          port: 8086, status: 'checking' },
  { name: 'Notifications',      port: 8088, status: 'checking' },
  { name: 'USSD Service',       port: 8089, status: 'checking' },
]

const STAT_CARDS = [
  { label: 'Total Patients',    value: '—', icon: Users,         color: 'text-blue-400' },
  { label: 'Today's Appts',   value: '—', icon: Calendar,      color: 'text-green-400' },
  { label: 'Active Alerts',     value: '—', icon: AlertTriangle, color: 'text-orange-400' },
  { label: 'Services Online',   value: '—', icon: Activity,      color: 'text-cyan-400' },
]

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          Dashboard
        </h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Welcome back, {user?.fullName} · {user?.facilityName}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
          <div key={label}
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wide">
                {label}
              </span>
              <Icon size={16} className={color} />
            </div>
            <div className="font-display text-2xl font-bold text-[var(--text-primary)]">
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Service health */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
        <h2 className="font-display text-base font-semibold text-[var(--text-primary)] mb-4">
          Service Health
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SERVICES.map(({ name, port }) => (
            <div key={name}
              className="flex items-center justify-between px-3 py-2
                rounded-lg bg-[var(--bg-primary)]">
              <span className="text-sm text-[var(--text-primary)]">{name}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[var(--text-secondary)]">:{port}</span>
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" title="Checking..." />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-3">
          Live health checks will be connected in Week 3 (API Gateway).
        </p>
      </div>
    </div>
  )
}
