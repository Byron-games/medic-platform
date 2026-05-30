import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { AxiosRequestConfig } from 'axios'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string
  refetch: () => void
}

/**
 * useApi — generic hook for fetching data from the M.E.D.I.C. API.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApi<Patient[]>('/patients')
 *
 * Features:
 *   - Auto-fetches on mount and when `url` changes
 *   - Cancels in-flight requests on unmount (avoids state updates on unmounted components)
 *   - Returns typed data, loading boolean, error string, and refetch function
 *   - Skips fetch when `skip` is true (useful for conditional fetching)
 */
export function useApi<T>(
  url: string,
  options?: AxiosRequestConfig,
  skip = false
): UseApiState<T> {
  const [data, setData]       = useState<T | null>(null)
  const [loading, setLoading] = useState(!skip)
  const [error, setError]     = useState('')
  const [tick, setTick]       = useState(0)

  const refetch = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    if (skip) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')

    api.get<T>(url, options)
      .then(res => {
        if (!cancelled) {
          setData(res.data)
          setLoading(false)
        }
      })
      .catch(err => {
        if (!cancelled) {
          const msg = (err as { response?: { data?: { message?: string } } })
            ?.response?.data?.message ?? 'Failed to load data'
          setError(msg)
          setLoading(false)
        }
      })

    return () => { cancelled = true }
  }, [url, tick, skip])  // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch }
}
