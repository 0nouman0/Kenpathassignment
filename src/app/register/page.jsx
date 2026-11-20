'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { BloodDropIcon, AlertTriangleIcon } from '@/components/Icons'

export default function RegisterPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
    setFormError('')
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required.'
    if (!form.email.trim()) errs.email = 'Email is required.'
    if (!form.password) errs.password = 'Password is required.'
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters.'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setLoading(true)
    setFormError('')
    try {
      const userTimezone = Intl?.DateTimeFormat?.().resolvedOptions()?.timeZone || 'UTC'
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, timezone: userTimezone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error || 'Registration failed. Please try again.')
        return
      }

      login(data.token, data.user)
      router.push('/')
    } catch {
      setFormError('Network connection failed. Please try again.')
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

        <h2 className="auth-title">Create Patient Account</h2>

        <form onSubmit={handleSubmit} noValidate>
          {formError && (
            <div className="form-error-banner" role="alert">
              <AlertTriangleIcon size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Jane Doe"
              autoFocus
              className={errors.name ? 'input-error' : ''}
            />
            {errors.name && <span className="field-error" role="alert">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="field-error" role="alert">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password (min 6 characters)</label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={errors.password ? 'input-error' : ''}
            />
            {errors.password && <span className="field-error" role="alert">{errors.password}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
            style={{ marginTop: '8px', padding: '11px' }}
          >
            {loading ? 'Creating account…' : 'Register Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already registered? <Link href="/login">Sign in here</Link>
        </p>
      </div>
    </div>
  )
}
