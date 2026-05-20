import { useAuth } from './AuthProvider.jsx'
import { useApp } from '../context/AppContext.jsx'

export function useRole() {
  const { user } = useAuth()
  const { userRoles } = useApp()
  if (!user) return 'none'
  return userRoles?.[user.email] ?? 'trener'
}

export function useCanEdit() {
  const role = useRole()
  return role === 'admin' || role === 'vybor'
}
