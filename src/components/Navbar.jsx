'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { BloodDropIcon, ActivityIcon, CalendarIcon, FileTextIcon, LogoutIcon } from './Icons'

export default function Navbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

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
