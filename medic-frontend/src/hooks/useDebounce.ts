import { useState, useEffect } from 'react'

/**
 * useDebounce — delays updating a value until the user stops typing.
 *
 * Usage:
 *   const debouncedSearch = useDebounce(searchTerm, 300)
 *   useEffect(() => { fetchResults(debouncedSearch) }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
