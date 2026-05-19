import { createContext, useContext, useEffect, useState } from 'react'
import { getStoredAuth, handleCallback, startLogin, logout } from './authUtils.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth,    setAuth]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (window.location.pathname === '/auth') {
      handleCallback()
        .then((result) => {
          if (result) setAuth(result)
          window.history.replaceState({}, '', '/')
        })
        .catch((err) => {
          setError(err.message)
          window.history.replaceState({}, '', '/')
        })
        .finally(() => setLoading(false))
    } else {
      setAuth(getStoredAuth())
      setLoading(false)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user: auth?.user ?? null, loading, error, login: startLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
