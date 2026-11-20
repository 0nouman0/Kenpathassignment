'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import ReportCard from '@/components/ReportCard'
import GlucoseChart from '@/components/GlucoseChart'
import { CalendarIcon, AlertTriangleIcon } from '@/components/Icons'
import { formatDisplayDate } from '@/lib/glucose'
import {
  calculateTimeInRange,
  calculateEstimatedHbA1c,
  ADA_CITATION,
  MEDICAL_DISCLAIMER,
} from '@/config/clinical'

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

      // Fetch month's readings for the Recharts line chart and TIR
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

  const handleExportCsv = () => {
    if (!chartReadings || chartReadings.length === 0) return
    const headers = ['Date', 'Time Slot', 'Value (mg/dL)', 'Value (mmol/L)', 'Status', 'Tags', 'Notes']
    const rows = chartReadings.map((r) => [
      r.reading_date,
      r.time_slot,
      r.value_mgdl,
      (r.value_mgdl / 18.016).toFixed(1),
      r.value_mgdl >= 70 && r.value_mgdl <= 180 ? 'In Target' : r.value_mgdl < 70 ? 'Low' : 'Elevated',
      `"${(r.tags || []).join('; ')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ])
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sweety_metabolic_report_${date}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Calculate clinical additions
  const tirPercent = calculateTimeInRange(chartReadings)
  const averageGlucose = mtd?.stats?.average || monthly?.stats?.average || null
  const estimatedA1c = calculateEstimatedHbA1c(averageGlucose)

  // Trend insight: compare last 7 readings with prior 7 readings
  let trendInsight = 'Adequate readings required for trend comparison.'
  if (chartReadings.length >= 8) {
    const sorted = [...chartReadings].sort((a, b) => b.reading_date.localeCompare(a.reading_date))
    const recent = sorted.slice(0, 7)
    const prior = sorted.slice(7, 14)
    if (prior.length > 0) {
      const recentAvg = recent.reduce((s, r) => s + Number(r.value_mgdl), 0) / recent.length
      const priorAvg = prior.reduce((s, r) => s + Number(r.value_mgdl), 0) / prior.length
      const diff = parseFloat((recentAvg - priorAvg).toFixed(1))
      if (diff < -2) {
        trendInsight = `▼ Glycemic average improved by ${Math.abs(diff)} mg/dL compared to previous period.`
      } else if (diff > 2) {
        trendInsight = `▲ Glycemic average increased by ${diff} mg/dL compared to previous period.`
      } else {
        trendInsight = `● Glycemic levels remained clinically stable (spread: ${diff >= 0 ? '+' : ''}${diff} mg/dL).`
      }
    }
  }

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
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportCsv}
            disabled={chartReadings.length === 0}
            title="Download CSV report"
          >
            Download CSV
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.print()}
            title="Print or Save as PDF"
          >
            Print Summary
          </button>
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
          {/* Key Clinical Insights Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {/* Time in Range */}
            <div className="report-card" style={{ padding: '16px 20px' }}>
              <span className="stat-label">Time-in-Range (70–180 mg/dL)</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '8px 0' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: tirPercent >= 70 ? '#059669' : '#d97706' }}>
                  {tirPercent}%
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  (ADA Target: &ge; 70%)
                </span>
              </div>
              <div style={{ background: '#e2e8f0', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, tirPercent)}%`,
                    height: '100%',
                    background: tirPercent >= 70 ? '#059669' : '#d97706',
                    borderRadius: '4px',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>

            {/* Estimated HbA1c */}
            <div className="report-card" style={{ padding: '16px 20px' }}>
              <span className="stat-label">Estimated HbA1c (ADAG Model)</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '8px 0' }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
                  {estimatedA1c ? `${estimatedA1c}%` : '—'}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {averageGlucose ? `(from eAG ${averageGlucose} mg/dL)` : 'Target: < 7.0%'}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Calculated via <code>eAG = 28.7 &times; A1c &minus; 46.7</code>
              </span>
            </div>

            {/* Week over Week Trend */}
            <div className="report-card" style={{ padding: '16px 20px' }}>
              <span className="stat-label">Trend Insights</span>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155', margin: '10px 0 6px' }}>
                {trendInsight}
              </p>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Based on active cohort data window
              </span>
            </div>
          </div>

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

          {/* Clinical Reference & Disclaimer Footer */}
          <div
            style={{
              marginTop: '32px',
              padding: '16px 20px',
              borderRadius: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '0.75rem',
              color: '#64748b',
              lineHeight: 1.5,
            }}
          >
            <p style={{ fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
              Clinical Guidelines: {ADA_CITATION}
            </p>
            <p>
              <strong>Disclaimer:</strong> {MEDICAL_DISCLAIMER}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
