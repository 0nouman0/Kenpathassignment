'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { BloodDropIcon, AlertTriangleIcon } from '@/components/Icons'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ email: 'demo@sweety.app', password: 'Demo1234!' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed. Please check your credentials.')
        return
      }

      login(data.token, data.user)
      router.push('/')
    } catch {
      setError('Network connection failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-icon-wrapper" style={{ width: '44px', height: '44px', marginBottom: '8px' }}>
            <BloodDropIcon size={26} />
          </div>
          <h1 className="brand-name" style={{ fontSize: '1.5rem' }}>Sweety</h1>
          <p className="brand-tagline">Clinical Blood Glucose Tracker</p>
        </div>

        <h2 className="auth-title">Sign In to Your Account</h2>

        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="form-error-banner" role="alert">
              <AlertTriangleIcon size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="patient@example.com"
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ marginTop: '8px', padding: '11px' }}
          >
            {loading ? 'Authenticating…' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account? <Link href="/register">Create an account</Link>
        </p>

        <div className="auth-demo-hint">
          <strong>Pre-loaded Demo Patient:</strong>
          <br />
          Email: <code>demo@sweety.app</code> · Password: <code>Demo1234!</code>
        </div>
      </div>
    </div>
  )
}
