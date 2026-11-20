'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import ReportCard from '@/components/ReportCard'
import GlucoseChart from '@/components/GlucoseChart'
import { CalendarIcon, AlertTriangleIcon } from '@/components/Icons'
import { formatDisplayDate } from '@/lib/glucose'

const todayStr = () => new Date().toISOString().split('T')[0]

export default function ReportsPage() {
  const { user, token, loading: authLoading } = useAuth()
  const router = useRouter()
  const [date, setDate] = useState(todayStr())
  const [daily, setDaily] = useState(null)
  const [mtd, setMtd] = useState(null)
  const [monthly, setMonthly] = useState(null)
  const [chartReadings, setChartReadings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const fetchReports = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const [dRes, mRes, moRes] = await Promise.allSettled([
        fetch(`/api/reports/daily?date=${date}`, { headers }).then((r) => r.json()),
        fetch(`/api/reports/month-to-date?date=${date}`, { headers }).then((r) => r.json()),
        fetch(`/api/reports/monthly?date=${date}`, { headers }).then((r) => r.json()),
      ])

      setDaily(dRes.status === 'fulfilled' ? dRes.value : null)
      setMtd(mRes.status === 'fulfilled' ? mRes.value : null)
      setMonthly(moRes.status === 'fulfilled' ? moRes.value : null)

      // Fetch month's readings for the Recharts line chart
      const [year, month] = date.split('-')
      try {
        const allRes = await fetch('/api/readings?limit=100&page=1', { headers })
        if (allRes.ok) {
          const allData = await allRes.json()
          const rows = allData.data || allData.readings || []
          const filtered = rows.filter((r) => {
            const raw = r.reading_date.includes('T') ? r.reading_date.split('T')[0] : r.reading_date
            return raw.startsWith(`${year}-${month}`)
          })
          setChartReadings(filtered)
        }
      } catch {
        setChartReadings([])
      }
    } catch {
      setError('Unable to load glucose reports. Please check your network connection.')
    } finally {
      setLoading(false)
    }
  }, [date, user, token])

  useEffect(() => {
    if (user) {
      fetchReports()
    }
  }, [user, fetchReports])

  if (authLoading || (!user && typeof window !== 'undefined')) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Loading reports…</p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Metabolic Reports & Analytics</h1>
          <p className="page-subtitle">
            Clinical glycemic aggregates, high/low spread, and historical comparisons
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-left">
          <div className="filter-input-group">
            <CalendarIcon size={16} style={{ color: 'var(--slate-500)' }} />
            <label htmlFor="report-date">Target Date:</label>
            <input
              id="report-date"
              type="date"
              value={date}
              max={todayStr()}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8125rem' }}
            />
          </div>

          <div className="filter-presets">
            <button
              type="button"
              className={`filter-preset-btn ${date === todayStr() ? 'active' : ''}`}
              onClick={() => setDate(todayStr())}
            >
              Today
            </button>
          </div>
        </div>

        <div className="result-count-badge">
          Anchor date: {formatDisplayDate(date)}
        </div>
      </div>

      {error && (
        <div className="form-error-banner" role="alert">
          <AlertTriangleIcon size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="page-loading">
          <div className="spinner" />
          <p>Calculating glycemic statistics…</p>
        </div>
      ) : (
        <>
          <div className="report-cards-row">
            <ReportCard
              title="Daily Report"
              subtitle="Selected reporting date"
              dateRange={daily?.dateRange}
              stats={daily?.stats}
              readings={daily?.readings}
            />

            <ReportCard
              title="Month-to-Date"
              subtitle="1st of month to selected date"
              dateRange={mtd?.dateRange}
              stats={mtd?.stats}
            />

            <ReportCard
              title="Monthly (Prior Month)"
              subtitle="Complete previous calendar month"
              dateRange={monthly?.dateRange}
              stats={monthly?.stats}
            />
          </div>

          {/* Recharts Monthly Glucose Trend Chart */}
          <GlucoseChart readings={chartReadings} />
        </>
      )}
    </div>
  )
}
