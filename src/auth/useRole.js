import { useAuth } from './AuthProvider.jsx'
import { useApp } from '../context/AppContext.jsx'

// Hook: vrátí roli aktuálního uživatele ('admin', 'vybor', 'trener', nebo 'none')
export function useRole() {
  const { user } = useAuth()
  const { userRoles } = useApp()
  if (!user) return 'none'
  const hasAnyAdmin = Object.values(userRoles ?? {}).some((r) => r === 'admin')
  if (!hasAnyAdmin) return 'admin'
  return userRoles?.[user.email] ?? 'trener'
}

// Hook: vrátí true pokud má uživatel právo editovat (admin nebo vybor)
export function useCanEdit() {
  const role = useRole()
  return role === 'admin' || role === 'vybor'
}
