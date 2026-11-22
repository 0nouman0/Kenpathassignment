import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth'
import { Wordmark } from '../components/Layout'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await login({ email, password })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <main className="auth">
      <div className="auth-intro">
        <Wordmark />
        <h1>Welcome back to your health companion.</h1>
        <p className="muted">
          Log up to four daily readings, track clinical targets, and generate verified reports for your doctor.
        </p>

        <div className="auth-highlights">
          <div className="auth-highlight-item">
            <span className="auth-check" aria-hidden="true">✓</span>
            <div>
              <strong>Verified Protocol</strong>
              <p>Mornings, breakfast, lunch, and dinner post-meal intervals.</p>
            </div>
          </div>
          <div className="auth-highlight-item">
            <span className="auth-check" aria-hidden="true">✓</span>
            <div>
              <strong>Strict ADA Thresholds</strong>
              <p>Instant feedback for fasting and postprandial glucose levels.</p>
            </div>
          </div>
          <div className="auth-highlight-item">
            <span className="auth-check" aria-hidden="true">✓</span>
            <div>
              <strong>Complete Data Isolation</strong>
              <p>Your blood glucose log is fully confidential and encrypted.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-card">
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-form-header">
            <h2>Sign In</h2>
            <p className="muted">Enter your account credentials below</p>
          </div>

          <div className="field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="button button-wide" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in to Logbook'}
          </button>

          <p className="muted auth-switch">
            Don&rsquo;t have an account? <Link to="/register">Create one</Link>
          </p>
        </form>
      </div>
    </main>
  )
}
