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
        <h1>A quiet place to keep your blood glucose log.</h1>
        <p className="muted">
          Up to four readings a day, with daily and monthly summaries you can show your doctor.
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <h2>Log in</h2>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
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
          {busy ? 'Logging in…' : 'Log in'}
        </button>
        <p className="muted auth-switch">
          New here? <Link to="/register">Create an account</Link>
        </p>
        <p className="auth-demo">
          Demo account: <code>demo@sweety.app</code> / <code>Demo1234!</code>
        </p>
      </form>
    </main>
  )
}
