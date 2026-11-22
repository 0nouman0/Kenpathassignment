import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth'
import { ToastProvider } from './Toast'

export function Wordmark() {
  return (
    <span className="wordmark">
      <span className="wordmark-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </svg>
      </span>
      <span>Sweety</span>
    </span>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U'

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
            <NavLink to="/welcome" className="nav-secondary">About</NavLink>
          </nav>
          <div className="topbar-user">
            <div className="user-avatar" title={user?.email || user?.name}>
              {initial}
            </div>
            <span className="topbar-name">{user?.name}</span>
            <button type="button" className="link-button logout-btn" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="footer-inner">
          <span>Target ranges: Fasting 70–130 mg/dl &bull; Post-meal &lt; 180 mg/dl (ADA guidance).</span>
          <span>Sweety is a clinical logbook, not diagnostic medical advice.</span>
        </div>
      </footer>
    </ToastProvider>
  )
}
