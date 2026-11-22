import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  // On first load, ask the server whether the login cookie is still valid.
  useEffect(() => {
    let active = true
    api
      .me()
      .then((data) => active && setUser(data.user))
      .catch(() => active && setUser(null))
      .finally(() => active && setChecking(false))
    return () => {
      active = false
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      checking,
      async login(credentials) {
        const data = await api.login(credentials)
        setUser(data.user)
      },
      async register(details) {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        const data = await api.register({ ...details, timezone })
        setUser(data.user)
      },
      async logout() {
        await api.logout().catch(() => {})
        setUser(null)
      },
    }),
    [user, checking]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
