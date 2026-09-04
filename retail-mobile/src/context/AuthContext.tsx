import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import * as SecureStore from 'expo-secure-store'

export type Role = 'OWNER' | 'CASHIER' | 'SELLER' | 'GOODS_STAFF' | 'CUSTOMER'

interface AuthUser {
  token: string
  role: Role
  userId: string
}

interface AuthContextType {
  user: AuthUser | null
  login: (token: string, role: Role, userId: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

// Global logout function for use outside React (e.g., axios interceptor)
let globalLogout: (() => void) | null = null
export function setGlobalLogout(fn: () => void) {
  globalLogout = fn
}
export function triggerGlobalLogout() {
  if (globalLogout) globalLogout()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStoredAuth()
  }, [])

  // Register logout globally so axios interceptor can trigger it
  useEffect(() => {
    setGlobalLogout(async () => {
      await SecureStore.deleteItemAsync('auth')
      setUser(null)
    })
    return () => setGlobalLogout(() => { })
  }, [])

  const loadStoredAuth = async () => {
    try {
      const storedAuth = await SecureStore.getItemAsync('auth')
      if (storedAuth) {
        const parsedUser = JSON.parse(storedAuth)
        if (parsedUser.role !== 'CUSTOMER') {
          await SecureStore.deleteItemAsync('auth')
          setUser(null)
        } else {
          setUser(parsedUser)
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (token: string, role: Role, userId: string) => {
    const authUser = { token, role, userId }
    await SecureStore.setItemAsync('auth', JSON.stringify(authUser))
    setUser(authUser)
  }

  const logout = async () => {
    await SecureStore.deleteItemAsync('auth')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}