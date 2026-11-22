import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth'
import { ToastProvider } from './Toast'

export function Wordmark() {
  return (
    <span className="wordmark">
      <span className="wordmark-dot" aria-hidden="true" />
      Sweety
    </span>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <ToastProvider>
      <header className="topbar">
        <div className="topbar-inner">
          <NavLink to="/" className="topbar-brand" aria-label="Sweety home">
            <Wordmark />
          </NavLink>
          <nav className="topnav" aria-label="Main">
            <NavLink to="/" end>
              Today
            </NavLink>
            <NavLink to="/readings">Readings</NavLink>
            <NavLink to="/reports">Reports</NavLink>
          </nav>
          <div className="topbar-user">
            <span className="topbar-name">{user.name}</span>
            <button type="button" className="link-button" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
      <footer className="footer">
        Target bands are general adult guidance (fasting 70–130, after meals under 180 mg/dl).
        Sweety is a logbook, not medical advice.
      </footer>
    </ToastProvider>
  )
}
