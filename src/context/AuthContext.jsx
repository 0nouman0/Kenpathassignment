'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const logout = useCallback(() => {
    localStorage.removeItem('sweety_token')
    localStorage.removeItem('sweety_user')
    document.cookie = 'sweety_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    setUser(null)
    setToken(null)
    router.push('/login')
  }, [router])

  const login = useCallback((jwtToken, userData) => {
    localStorage.setItem('sweety_token', jwtToken)
    localStorage.setItem('sweety_user', JSON.stringify(userData))
    document.cookie = `sweety_token=${jwtToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
    setToken(jwtToken)
    setUser(userData)
  }, [])

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('sweety_token')
      const storedUser = localStorage.getItem('sweety_user')
      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      }
    } catch (e) {
      console.error('Failed to restore auth:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
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
