import { useState, useEffect, createContext, useContext } from 'react'
import type { User } from '../services/api'

interface AuthContextValue {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  logout: () => void
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  setAuth: () => {},
  logout: () => {},
  isAuthenticated: false,
})

export function useAuthProvider(): AuthContextValue {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))

  const setAuth = (u: User, t: string) => {
    setUser(u)
    setToken(t)
    localStorage.setItem('user', JSON.stringify(u))
    localStorage.setItem('token', t)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  return { user, token, setAuth, logout, isAuthenticated: !!token }
}

export function useAuth() {
  return useContext(AuthContext)
}
