import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
  /** Label shown in the error UI to identify which section crashed */
  section?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * ErrorBoundary — catches render errors in child components so a single
 * failing widget (e.g. a broken chart) doesn't crash the entire page.
 *
 * Usage:
 *   <ErrorBoundary section="Analytics Chart">
 *     <AnalyticsChart />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary] ${this.props.section ?? 'Unknown section'}:`, error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center gap-3 p-8
          bg-[var(--bg-card)] border border-red-500/20 rounded-xl text-center">
          <AlertTriangle size={24} className="text-red-400" />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {this.props.section
                ? `${this.props.section} failed to load`
                : 'Something went wrong'}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {this.state.error?.message ?? 'An unexpected error occurred'}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs
              border border-[var(--border)] text-[var(--text-secondary)]
              hover:bg-[var(--border)] transition-colors"
          >
            <RefreshCw size={12} />
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
