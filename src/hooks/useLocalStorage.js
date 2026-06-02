import { useState, useEffect } from 'react'

// Hook: čte a ukládá hodnotu do localStorage; synchronizuje se s React state
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // localStorage full or unavailable
    }
  }, [key, value])

  return [value, setValue]
}
