'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionToast, setSessionToast] = useState(null)
  const router = useRouter()

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async (isSessionExpired = false) => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      console.warn('Logout API call failed:', e)
    }
    setUser(null)
    if (isSessionExpired) {
      setSessionToast({ type: 'error', message: 'Your session expired. Please sign in again.' })
    }
    router.push('/login')
  }, [router])

  const login = useCallback((userData) => {
    setUser(userData)
    setSessionToast(null)
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  // Custom fetch wrapper that handles 401 globally
  const authFetch = useCallback(
    async (url, options = {}) => {
      const res = await fetch(url, options)
      if (res.status === 401) {
        logout(true)
      }
      return res
    },
    [logout]
  )

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, authFetch, sessionToast, setSessionToast }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
