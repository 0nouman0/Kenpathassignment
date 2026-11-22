import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Today from './pages/Today'
import Readings from './pages/Readings'
import Reports from './pages/Reports'

function RequireAuth() {
  const { user, checking } = useAuth()
  if (checking) return <p className="boot">Loading…</p>
  if (!user) return <Navigate to="/login" replace />
  return <Layout />
}

function GuestOnly() {
  const { user, checking } = useAuth()
  if (checking) return <p className="boot">Loading…</p>
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route path="/" element={<Today />} />
        <Route path="/readings" element={<Readings />} />
        <Route path="/reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
