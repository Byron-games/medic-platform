import { Link } from 'react-router-dom'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-2">
          Registration
        </h1>
        <p className="text-[var(--text-secondary)] mb-4">
          Registration form — Week 2 (Auth Service)
        </p>
        <Link to="/login" className="text-[var(--accent)] hover:underline text-sm">
          Back to login
        </Link>
      </div>
    </div>
  )
}
