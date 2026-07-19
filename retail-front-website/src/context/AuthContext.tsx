import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export type Role = 'OWNER' | 'CASHIER' | 'SELLER' | 'GOODS_STAFF' | 'CUSTOMER'

interface AuthUser {
  token: string
  role: Role
  userId: string
}

interface AuthContextType {
  user: AuthUser | null
  login: (token: string, role: Role, userId: string) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('auth')
    return stored ? JSON.parse(stored) : null
  })

  const login = useCallback((token: string, role: Role, userId: string) => {
    const authUser = { token, role, userId }
    localStorage.setItem('auth', JSON.stringify(authUser))
    setUser(authUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('auth')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
