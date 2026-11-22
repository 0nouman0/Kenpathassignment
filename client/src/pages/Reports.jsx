import { useEffect, useState } from 'react'
import { api } from '../api'
import { formatDate, formatLong, formatRange, monthStart, todayLocal } from '../lib/dates'
import { slotLabel } from '../lib/glucose'
import Stats from '../components/Stats'
import Status from '../components/Status'
import TrendChart from '../components/TrendChart'

function ReportSection({ title, note, report, children }) {
  const empty = report && report.stats.count === 0
  return (
    <section className="report-card" aria-label={title}>
      <header className="report-card-head">
        <div>
          <span className="report-badge">{title}</span>
          <p className="report-range">{report ? formatRange(report.range) : ' '}</p>
        </div>
        <p className="report-note">{note}</p>
      </header>
      {empty ? (
        <div className="report-empty">
          <p>No readings recorded in this time range.</p>
        </div>
      ) : (
        <div className="report-card-body">
          <Stats stats={report?.stats} />
          {children}
        </div>
      )}
    </section>
  )
}

export default function Reports() {
  const today = todayLocal()
  const [date, setDate] = useState(today)
  const [data, setData] = useState(null)
  const [state, setState] = useState('loading')

  useEffect(() => {
    if (!date) return
    let active = true
    setState('loading')
    Promise.all([
      api.report('daily', date),
      api.report('month-to-date', date),
      api.report('monthly', date),
      api.listReadings({ from: monthStart(date), to: date, limit: 200 }),
    ])
      .then(([daily, mtd, monthly, trend]) => {
        if (!active) return
        setData({ daily, mtd, monthly, trend: trend.data })
        setState('ready')
      })
      .catch(() => active && setState('error'))
    return () => {
      active = false
    }
  }, [date])

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Clinical Analytics</p>
          <h1>{date ? formatLong(date) : 'Choose a date'}</h1>
        </div>
        <div className="toolbar-date-select">
          <label htmlFor="report-date">Anchor Date</label>
          <input
            id="report-date"
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {state === 'error' && (
        <p className="notice" role="alert">
          Could not load the reports. Please try again.
        </p>
      )}

      {state === 'loading' && !data && <p className="muted boot">Generating glycemic analytics…</p>}

      {data && (
        <div className={state === 'loading' ? 'is-stale' : undefined}>
          <div className="reports">
            <ReportSection title="Daily Report" note="Selected calendar day" report={data.daily}>
              <div className="day-breakdown">
                <span className="day-breakdown-title">Day&rsquo;s Slot Readings</span>
                <ul className="day-list">
                  {data.daily.readings.map((r) => (
                    <li key={r.id}>
                      <span className="slot-chip">{slotLabel(r.time_slot)}</span>
                      <span className="day-list-value">{r.value_mgdl} <span className="unit">mg/dl</span></span>
                      <Status value={r.value_mgdl} slot={r.time_slot} />
                    </li>
                  ))}
                </ul>
              </div>
            </ReportSection>

            <ReportSection
              title="Month to Date"
              note="1st of the month through anchor date"
              report={data.mtd}
            />

            <ReportSection
              title="Previous Month"
              note="Full previous calendar month"
              report={data.monthly}
            />
          </div>

          <section className="section" aria-labelledby="trend-title">
            <h2 id="trend-title" className="section-title">
              Monthly Trend Analysis (up to {formatDate(date)})
            </h2>
            {data.trend.length === 0 ? (
              <p className="empty">No readings this month yet to display trajectory.</p>
            ) : (
              <TrendChart readings={data.trend} />
            )}
          </section>
        </div>
      )}
    </>
  )
}
