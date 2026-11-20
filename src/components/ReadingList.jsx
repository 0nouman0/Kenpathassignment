import React from 'react'
import EmptyState from './EmptyState'
import { EditIcon, TrashIcon, ClockIcon } from './Icons'
import { SLOT_CONFIG, getGlucoseStatus, formatDisplayDate } from '@/lib/glucose'
import { useGlucoseUnit } from '@/context/UnitContext'
import { PRESET_TAGS, convertMgdlToMmol } from '@/config/clinical'

export default function ReadingList({
  readings = [],
  onEdit,
  onDelete,
  loading,
}) {
  const { unit } = useGlucoseUnit()

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

  const tagMap = Object.fromEntries(PRESET_TAGS.map((t) => [t.id, t.label]))

  return (
    <div className="table-wrapper">
      <table className="readings-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Time Slot</th>
            <th>Glucose Value</th>
            <th>Clinical Status</th>
            <th>Notes & Tags</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((r) => {
            const slotInfo = SLOT_CONFIG[r.time_slot] || { label: r.time_slot }
            const status = getGlucoseStatus(r.value_mgdl, r.time_slot)
            const displayVal = unit === 'mmol' ? convertMgdlToMmol(r.value_mgdl) : r.value_mgdl
            const unitLabel = unit === 'mmol' ? 'mmol/L' : 'mg/dL'

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
                    {displayVal}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginLeft: '3px' }}>
                    {unitLabel}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${status.className}`}>
                    <span className="status-badge-dot" />
                    <span>{status.label}</span>
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {r.tags && r.tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {r.tags.map((tagId) => (
                          <span
                            key={tagId}
                            style={{
                              padding: '2px 6px',
                              borderRadius: '12px',
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              background: '#f1f5f9',
                              color: '#334155',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            {tagMap[tagId] || tagId}
                          </span>
                        ))}
                      </div>
                    )}
                    {r.notes && (
                      <span style={{ fontSize: '0.775rem', color: '#64748b', fontStyle: 'italic' }}>
                        &ldquo;{r.notes}&rdquo;
                      </span>
                    )}
                    {(!r.tags || r.tags.length === 0) && !r.notes && (
                      <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>–</span>
                    )}
                  </div>
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
