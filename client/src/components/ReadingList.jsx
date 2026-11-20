import React from 'react'
import EmptyState from './EmptyState'
import { EditIcon, TrashIcon, ClockIcon } from './Icons'
import { SLOT_CONFIG, getGlucoseStatus, formatDisplayDate } from '../utils/glucose'

export default function ReadingList({
  readings = [],
  onEdit,
  onDelete,
  loading,
}) {
  if (loading) {
    return (
      <div className="table-wrapper" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem' }}>Loading readings…</p>
      </div>
    )
  }

  if (!readings || readings.length === 0) {
    return (
      <EmptyState
        title="No readings found"
        message="No blood glucose records match your selected filter. Log a reading to track your trends."
      />
    )
  }

  return (
    <div className="table-wrapper">
      <table className="readings-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Time Slot</th>
            <th>Glucose Value</th>
            <th>Clinical Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((r) => {
            const slotInfo = SLOT_CONFIG[r.time_slot] || { label: r.time_slot }
            const status = getGlucoseStatus(r.value_mgdl, r.time_slot)
            return (
              <tr key={r.id}>
                <td className="date-cell-formatted">
                  {formatDisplayDate(r.reading_date)}
                </td>
                <td>
                  <span className="slot-tag">
                    <ClockIcon size={14} />
                    <span>{slotInfo.label}</span>
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                    {r.value_mgdl}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginLeft: '3px' }}>
                    mg/dL
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${status.className}`}>
                    <span className="status-badge-dot" />
                    <span>{status.label}</span>
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn-icon btn-edit"
                      onClick={() => onEdit(r)}
                      title="Edit this reading"
                      aria-label="Edit"
                    >
                      <EditIcon size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon btn-delete"
                      onClick={() => onDelete(r)}
                      title="Delete this reading"
                      aria-label="Delete"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
