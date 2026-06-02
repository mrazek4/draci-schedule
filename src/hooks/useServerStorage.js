import { useState, useEffect, useRef } from 'react'

// Hook: synchronizuje state se serverem (/api/state), s fallbackem do localStorage
export function useServerStorage(key, initialValue) {
  const [value, setValue] = useState(initialValue)
  const [isLoading, setIsLoading] = useState(true)
  const loaded = useRef(false)
  const timer = useRef(null)

  useEffect(() => {
    fetch('/api/state')
      .then((r) => r.json())
      .then((data) => { if (data) setValue(data) })
      .catch(() => {
        try {
          const stored = localStorage.getItem(key)
          if (stored) setValue(JSON.parse(stored))
        } catch {}
      })
      .finally(() => { loaded.current = true; setIsLoading(false) })
  }, [])

  useEffect(() => {
    if (!loaded.current) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
      }).catch(() => {
        try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
      })
    }, 600)
  }, [value])

  return [value, setValue, isLoading]
}
