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

  const field = (name, label, type, autoComplete) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        type={type}
        autoComplete={autoComplete}
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
        <h1>Start your log.</h1>
        <p className="muted">
          Your readings are private to your account. Nobody else can see or change them.
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <h2>Create an account</h2>
        {field('name', 'Name', 'text', 'name')}
        {field('email', 'Email', 'email', 'email')}
        {field('password', 'Password (8 or more characters)', 'password', 'new-password')}
        {errors.form && (
          <p className="form-error" role="alert">
            {errors.form}
          </p>
        )}
        <button type="submit" className="button button-wide" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p className="muted auth-switch">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </form>
    </main>
  )
}
