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
    <section className="report" aria-label={title}>
      <header>
        <h2>{title}</h2>
        <p className="report-range">{report ? formatRange(report.range) : ' '}</p>
        <p className="muted">{note}</p>
      </header>
      {empty ? (
        <p className="empty">No readings in this period.</p>
      ) : (
        <>
          <Stats stats={report?.stats} />
          {children}
        </>
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
          <p className="eyebrow">Reports</p>
          <h1>{date ? formatLong(date) : 'Choose a date'}</h1>
        </div>
        <div className="field field-inline">
          <label htmlFor="report-date">Report date</label>
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

      {state === 'loading' && !data && <p className="muted">Loading…</p>}

      {data && (
        <div className={state === 'loading' ? 'is-stale' : undefined}>
          <div className="reports">
            <ReportSection title="Daily" note="The selected date" report={data.daily}>
              <ul className="day-list">
                {data.daily.readings.map((r) => (
                  <li key={r.id}>
                    <span>{slotLabel(r.time_slot)}</span>
                    <span className="day-list-value">{r.value_mgdl}</span>
                    <Status value={r.value_mgdl} slot={r.time_slot} />
                  </li>
                ))}
              </ul>
            </ReportSection>
            <ReportSection
              title="Month to date"
              note="1st of the month to the selected date"
              report={data.mtd}
            />
            <ReportSection title="Previous month" note="The whole month before" report={data.monthly} />
          </div>

          <section className="section" aria-labelledby="trend-title">
            <h2 id="trend-title" className="section-title">
              This month, up to {formatDate(date)}
            </h2>
            {data.trend.length === 0 ? (
              <p className="empty">No readings this month yet, so there is nothing to plot.</p>
            ) : (
              <TrendChart readings={data.trend} />
            )}
          </section>
        </div>
      )}
    </>
  )
}
