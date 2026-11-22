import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth'
import { Wordmark } from '../components/Layout'

export default function Register() {
  const { register } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const found = {}
    if (!form.name.trim()) found.name = 'Please enter your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      found.email = 'Please enter a valid email address.'
    }
    if (form.password.length < 8) found.password = 'Password must be at least 8 characters.'
    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }

    setBusy(true)
    try {
      await register(form)
    } catch (err) {
      setErrors(err.field ? { [err.field]: err.message } : { form: err.message })
      setBusy(false)
    }
  }

  const field = (name, label, type, autoComplete, placeholder) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={form[name]}
        onChange={set(name)}
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
      />
      {errors[name] && (
        <p className="field-error" id={`${name}-error`} role="alert">
          {errors[name]}
        </p>
      )}
    </div>
  )

  return (
    <main className="auth">
      <div className="auth-intro">
        <Wordmark />
        <h1>Start your personal glucose logbook.</h1>
        <p className="muted">
          Join thousands of proactive patients taking charge of their glycemic control. No subscription, no clutter.
        </p>

        <div className="auth-highlights">
          <div className="auth-highlight-item">
            <span className="auth-check" aria-hidden="true">✓</span>
            <div>
              <strong>Instant Analytics</strong>
              <p>Daily summaries and month-to-date tracking automatically computed.</p>
            </div>
          </div>
          <div className="auth-highlight-item">
            <span className="auth-check" aria-hidden="true">✓</span>
            <div>
              <strong>Physician-Friendly Reports</strong>
              <p>Organised logs ready to export and share during checkups.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-card">
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-form-header">
            <h2>Create Account</h2>
            <p className="muted">Set up your private tracker in 30 seconds</p>
          </div>

          {field('name', 'Full name', 'text', 'name', 'e.g. Jane Doe')}
          {field('email', 'Email address', 'email', 'email', 'name@example.com')}
          {field('password', 'Password (8 or more characters)', 'password', 'new-password', 'Minimum 8 characters')}

          {errors.form && (
            <p className="form-error" role="alert">
              {errors.form}
            </p>
          )}

          <button type="submit" className="button button-wide" disabled={busy}>
            {busy ? 'Creating account…' : 'Create Account'}
          </button>

          <p className="muted auth-switch">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </main>
  )
}
