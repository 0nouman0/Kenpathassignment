'use client'

import React, { useState, useEffect } from 'react'
import { AlertTriangleIcon, CloseIcon } from './Icons'

export default function MemoryNoticeBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Check if dismissed in this browser session
    if (typeof window !== 'undefined' && sessionStorage.getItem('sweety_memory_banner_dismissed') === 'true') {
      return
    }

    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.db === 'memory') {
          setShow(true)
        }
      })
      .catch(() => {
        // Ignore health check errors
      })
  }, [])

  const handleDismiss = () => {
    setShow(false)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sweety_memory_banner_dismissed', 'true')
    }
  }

  if (!show) return null

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        backgroundColor: '#fffbeb',
        borderBottom: '1px solid #fde68a',
        color: '#92400e',
        padding: '0.5rem 1rem',
        fontSize: '0.85rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <AlertTriangleIcon size={16} style={{ color: '#d97706', flexShrink: 0 }} />
        <span>
          <strong>Demo mode:</strong> Data is running on local in-memory storage and will not be saved permanently. Connect PostgreSQL via <code>DATABASE_URL</code> for persistent clinical records.
        </span>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss demo mode banner"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: '#92400e',
          display: 'flex',
          alignItems: 'center',
          padding: '2px',
        }}
      >
        <CloseIcon size={16} />
      </button>
    </div>
  )
}
