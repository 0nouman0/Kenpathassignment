import React from 'react'
import { SLOT_CONFIG, getGlucoseStatus, formatDisplayDate } from '../utils/glucose'
import { ActivityIcon, ClockIcon } from './Icons'

export default function ReportCard({
  title,
  subtitle,
  dateRange,
  stats,
  readings = null,
}) {
  const hasData = stats && stats.count > 0

  return (
    <div className="report-card">
      <div className="report-card-header">
        <h3 className="report-card-title">{title}</h3>
        {dateRange && (
          <p className="report-date-range">
            {formatDisplayDate(dateRange.from)}
            {dateRange.from !== dateRange.to && ` — ${formatDisplayDate(dateRange.to)}`}
          </p>
        )}
        {subtitle && (
          <span style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>
            {subtitle}
          </span>
        )}
      </div>

      {!hasData ? (
        <div style={{ textAlign: 'center', padding: '32px 12px', color: 'var(--slate-500)', fontSize: '0.8125rem' }}>
          <ActivityIcon size={24} className="" style={{ margin: '0 auto 8px', color: 'var(--slate-300)' }} />
          <p style={{ fontWeight: 500, color: 'var(--slate-700)' }}>No readings recorded</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '2px' }}>
            No glucose entries found for this reporting window.
          </p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Highest</span>
              <div className="stat-value stat-high">
                {stats.highest ?? '—'}
                <span className="stat-unit">mg/dL</span>
              </div>
            </div>

            <div className="stat-item">
              <span className="stat-label">Lowest</span>
              <div className="stat-value stat-low">
                {stats.lowest ?? '—'}
                <span className="stat-unit">mg/dL</span>
              </div>
            </div>

            <div className="stat-item">
              <span className="stat-label">Average</span>
              <div className="stat-value stat-avg">
                {stats.average != null ? Number(stats.average).toFixed(1) : '—'}
                <span className="stat-unit">mg/dL</span>
              </div>
            </div>

            <div className="stat-item">
              <span className="stat-label">Total Readings</span>
              <div className="stat-value stat-count">
                {stats.count ?? 0}
                <span className="stat-unit">logged</span>
              </div>
            </div>
          </div>

          {/* Daily report specific: list each reading with its slot */}
          {Array.isArray(readings) && readings.length > 0 && (
            <div className="report-readings-list">
              <h4>Daily Slot Breakdown</h4>
              <ul>
                {readings.map((r) => {
                  const slotConfig = SLOT_CONFIG[r.time_slot] || { label: r.time_slot }
                  const status = getGlucoseStatus(r.value_mgdl, r.time_slot)
                  return (
                    <li key={r.id} className="report-reading-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ClockIcon size={13} />
                        <span style={{ fontWeight: 500, color: 'var(--slate-700)' }}>
                          {slotConfig.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="reading-val">{r.value_mgdl} mg/dL</span>
                        <span className={`status-badge ${status.className}`}>
                          <span className="status-badge-dot" />
                          <span>{status.label}</span>
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
