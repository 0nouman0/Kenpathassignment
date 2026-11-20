import React from 'react'
import { SLOT_CONFIG, getGlucoseStatus, formatDisplayDate } from '@/lib/glucose'
import { ActivityIcon, ClockIcon } from './Icons'
import { useGlucoseUnit } from '@/context/UnitContext'
import { convertMgdlToMmol } from '@/config/clinical'

export default function ReportCard({
  title,
  subtitle,
  dateRange,
  stats,
  readings = null,
}) {
  const { unit } = useGlucoseUnit()
  const hasData = stats && stats.count > 0
  const isMmol = unit === 'mmol'
  const unitLabel = isMmol ? 'mmol/L' : 'mg/dL'

  const formatStat = (val) => {
    if (val == null) return '—'
    return isMmol ? convertMgdlToMmol(val) : Number(val).toFixed(val % 1 !== 0 ? 1 : 0)
  }

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
          <ActivityIcon size={24} style={{ margin: '0 auto 8px', color: 'var(--slate-300)' }} />
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
                {formatStat(stats.highest)}
                <span className="stat-unit">{unitLabel}</span>
              </div>
            </div>

            <div className="stat-item">
              <span className="stat-label">Lowest</span>
              <div className="stat-value stat-low">
                {formatStat(stats.lowest)}
                <span className="stat-unit">{unitLabel}</span>
              </div>
            </div>

            <div className="stat-item">
              <span className="stat-label">Average</span>
              <div className="stat-value stat-avg">
                {stats.average != null ? (isMmol ? convertMgdlToMmol(stats.average) : Number(stats.average).toFixed(1)) : '—'}
                <span className="stat-unit">{unitLabel}</span>
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

          {Array.isArray(readings) && readings.length > 0 && (
            <div className="report-readings-list">
              <h4>Daily Slot Breakdown</h4>
              <ul>
                {readings.map((r) => {
                  const slotConfig = SLOT_CONFIG[r.time_slot] || { label: r.time_slot }
                  const status = getGlucoseStatus(r.value_mgdl, r.time_slot)
                  const displayVal = isMmol ? convertMgdlToMmol(r.value_mgdl) : r.value_mgdl
                  return (
                    <li key={r.id} className="report-reading-item">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ClockIcon size={13} />
                        <span style={{ fontWeight: 500, color: 'var(--slate-700)' }}>
                          {slotConfig.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="reading-val">{displayVal} {unitLabel}</span>
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
