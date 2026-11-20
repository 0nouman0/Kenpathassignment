import { useState, useEffect, useCallback } from 'react'
import { getDaily, getMonthToDate, getMonthly } from '../api/reports'
import { getReadings } from '../api/readings'
import ReportCard from '../components/ReportCard'
import GlucoseChart from '../components/GlucoseChart'
import { CalendarIcon, AlertTriangleIcon } from '../components/Icons'
import { formatDisplayDate } from '../utils/glucose'

const todayStr = () => new Date().toISOString().split('T')[0]

export default function ReportsPage() {
  const [date, setDate] = useState(todayStr())
  const [daily, setDaily] = useState(null)
  const [mtd, setMtd] = useState(null)
  const [monthly, setMonthly] = useState(null)
  const [chartReadings, setChartReadings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [dRes, mRes, moRes] = await Promise.allSettled([
        getDaily(date),
        getMonthToDate(date),
        getMonthly(date),
      ])

      setDaily(dRes.status === 'fulfilled' ? dRes.value.data : null)
      setMtd(mRes.status === 'fulfilled' ? mRes.value.data : null)
      setMonthly(moRes.status === 'fulfilled' ? moRes.value.data : null)

      // Fetch readings for the month for the Recharts line chart
      const [year, month] = date.split('-')
      try {
        const allRes = await getReadings({ limit: 100, page: 1 })
        const allRows = allRes.data?.data || allRes.data?.readings || []
        const currentMonthReadings = allRows.filter((r) => {
          const raw = r.reading_date.includes('T') ? r.reading_date.split('T')[0] : r.reading_date
          return raw.startsWith(`${year}-${month}`)
        })
        setChartReadings(currentMonthReadings)
      } catch {
        setChartReadings([])
      }
    } catch (err) {
      setError('Unable to load glucose reports. Please check your network connection.')
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

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
          {/* 3 Report Cards: Daily, Month-to-date, Monthly (previous full month) */}
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
