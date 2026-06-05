import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import {
  LayoutDashboard, Users, FileText, Calendar, Video,
  Pill, BarChart3, Menu, X, Sun, Moon, LogOut
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard',     label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/patients',      label: 'Patients',    icon: Users },
  { to: '/records',       label: 'Records',     icon: FileText },
  { to: '/appointments',  label: 'Appointments',icon: Calendar },
  { to: '/telemedicine',  label: 'Telemedicine',icon: Video },
  { to: '/pharmacy',      label: 'Pharmacy',    icon: Pill },
  { to: '/analytics',     label: 'Analytics',   icon: BarChart3 },
]

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const { theme, toggle } = useThemeStore()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)]">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[var(--bg-secondary)] border-r border-[var(--border)]
        transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--border)]">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <span className="text-white font-display font-bold text-sm">M</span>
          </div>
          <span className="font-display font-bold text-[var(--text-primary)] text-lg">M.E.D.I.C.</span>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${isActive
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
                }
              `}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--border)]">
          <div className="text-xs text-[var(--text-secondary)] mb-1 truncate">{user?.fullName}</div>
          <div className="text-xs text-[var(--accent)] font-mono truncate">{user?.role}</div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex items-center justify-between px-4 lg:px-6 py-4
          border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="hidden lg:block text-[var(--text-secondary)] text-sm">
            {user?.facilityName}
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-[var(--text-secondary)]
                hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-[var(--text-secondary)]
                hover:text-red-500 hover:bg-[var(--border)] transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
