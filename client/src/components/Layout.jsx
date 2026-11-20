import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BloodDropIcon, ActivityIcon, CalendarIcon, FileTextIcon, LogoutIcon } from './Icons'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'P'

  return (
    <div className="app-wrapper">
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <NavLink to="/" className="navbar-brand">
          <div className="brand-icon-wrapper">
            <BloodDropIcon size={20} />
          </div>
          <div className="brand-text-group">
            <span className="brand-name">Sweety</span>
            <span className="brand-tagline">Glucose Tracker</span>
          </div>
        </NavLink>

        <div className="navbar-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <ActivityIcon size={16} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/readings"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <CalendarIcon size={16} />
            <span>Readings</span>
          </NavLink>
          <NavLink
            to="/reports"
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            <FileTextIcon size={16} />
            <span>Reports</span>
          </NavLink>
        </div>

        <div className="navbar-user">
          {user && (
            <div className="user-profile-badge" title={user.email}>
              <div className="user-avatar-initial">{userInitial}</div>
              <span className="user-name">{user.name}</span>
            </div>
          )}
          <button
            type="button"
            className="btn btn-outline-sm"
            onClick={handleLogout}
            title="Sign out of your account"
          >
            <LogoutIcon size={14} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
