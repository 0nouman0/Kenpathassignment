'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useGlucoseUnit } from '@/context/UnitContext'
import { BloodDropIcon, ActivityIcon, CalendarIcon, FileTextIcon, LogoutIcon, SunIcon, MoonIcon } from './Icons'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { unit, toggleUnit } = useGlucoseUnit()
  const [isDark, setIsDark] = React.useState(false)
  const pathname = usePathname()

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('sweety_theme')
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
        setIsDark(true)
        document.documentElement.setAttribute('data-theme', 'dark')
      }
    }
  }, [])

  const toggleTheme = () => {
    const nextDark = !isDark
    setIsDark(nextDark)
    if (typeof window !== 'undefined') {
      if (nextDark) {
        document.documentElement.setAttribute('data-theme', 'dark')
        localStorage.setItem('sweety_theme', 'dark')
      } else {
        document.documentElement.removeAttribute('data-theme')
        localStorage.setItem('sweety_theme', 'light')
      }
    }
  }

  if (!user && (pathname === '/login' || pathname === '/register')) {
    return null
  }

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'P'

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <Link href="/" className="navbar-brand">
        <div className="brand-icon-wrapper">
          <BloodDropIcon size={20} />
        </div>
        <div className="brand-text-group">
          <span className="brand-name">Sweety</span>
          <span className="brand-tagline">Clinical Tracker</span>
        </div>
      </Link>

      <div className="navbar-links">
        <Link
          href="/"
          className={`nav-link ${pathname === '/' ? 'active' : ''}`}
        >
          <ActivityIcon size={16} />
          <span>Dashboard</span>
        </Link>
        <Link
          href="/readings"
          className={`nav-link ${pathname === '/readings' ? 'active' : ''}`}
        >
          <CalendarIcon size={16} />
          <span>Readings</span>
        </Link>
        <Link
          href="/reports"
          className={`nav-link ${pathname === '/reports' ? 'active' : ''}`}
        >
          <FileTextIcon size={16} />
          <span>Reports</span>
        </Link>
      </div>

      <div className="navbar-user">
        <button
          type="button"
          onClick={toggleTheme}
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          aria-label={`Toggle dark mode, currently ${isDark ? 'dark' : 'light'}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            border: '1px solid #cbd5e1',
            background: '#f8fafc',
            color: '#475569',
            cursor: 'pointer',
          }}
        >
          {isDark ? <SunIcon size={15} /> : <MoonIcon size={15} />}
        </button>

        <button
          type="button"
          onClick={toggleUnit}
          title={`Click to switch between mg/dL and mmol/L (Current: ${unit === 'mgdl' ? 'mg/dL' : 'mmol/L'})`}
          aria-label={`Toggle glucose unit, currently ${unit === 'mgdl' ? 'mg/dL' : 'mmol/L'}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '16px',
            border: '1px solid #cbd5e1',
            background: '#f8fafc',
            cursor: 'pointer',
            fontSize: '0.725rem',
            fontWeight: 600,
          }}
        >
          <span style={{ color: unit === 'mgdl' ? '#0d9488' : '#94a3b8' }}>mg/dL</span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span style={{ color: unit === 'mmol' ? '#0d9488' : '#94a3b8' }}>mmol/L</span>
        </button>

        {user ? (
          <>
            <div className="user-profile-badge" title={user.email}>
              <div className="user-avatar-initial">{userInitial}</div>
              <span className="user-name">{user.name}</span>
            </div>
            <button
              type="button"
              className="btn btn-outline-sm"
              onClick={logout}
              title="Sign out of your account"
            >
              <LogoutIcon size={14} />
              <span>Logout</span>
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href="/login" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8125rem' }}>
              Sign In
            </Link>
            <Link href="/register" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8125rem' }}>
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
