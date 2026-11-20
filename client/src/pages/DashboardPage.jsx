import { useState, useEffect, useCallback } from 'react'
import { getReadings, deleteReading } from '../api/readings'
import { useAuth } from '../context/AuthContext'
import ReadingForm from '../components/ReadingForm'
import ConfirmModal from '../components/ConfirmModal'
import Toast from '../components/Toast'
import { PlusIcon, EditIcon, TrashIcon, CheckCircleIcon, ClockIcon } from '../components/Icons'
import {
  SLOT_CONFIG,
  SLOTS_ORDER,
  getGlucoseStatus,
  formatFullDate,
} from '../utils/glucose'

const todayStr = () => new Date().toISOString().split('T')[0]

export default function DashboardPage() {
  const { user } = useAuth()
  const [readings, setReadings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [activeSlot, setActiveSlot] = useState('')
  const [editingReading, setEditingReading] = useState(null)
  const [deletingReading, setDeletingReading] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const today = todayStr()
  const fullDateDisplay = formatFullDate(today)

  const fetchTodayReadings = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getReadings({ date: today, limit: 10 })
      const rows = res.data?.data || res.data?.readings || []
      setReadings(rows)
    } catch {
      setReadings([])
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => {
    fetchTodayReadings()
  }, [fetchTodayReadings])

  const readingBySlot = (slot) => readings.find((r) => r.time_slot === slot)

  const handleOpenAdd = (slot = '') => {
    setEditingReading(null)
    setActiveSlot(slot)
    setShowForm(true)
  }

  const handleOpenEdit = (reading) => {
    setEditingReading(reading)
    setActiveSlot(reading.time_slot)
    setShowForm(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingReading) return
    setDeleteLoading(true)
    try {
      await deleteReading(deletingReading.id)
      setToast({ type: 'success', message: 'Reading successfully removed.' })
      setDeletingReading(null)
      fetchTodayReadings()
    } catch (err) {
      setToast({
        type: 'error',
        message: err.response?.data?.error || 'Failed to delete reading.',
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  // Summary Metrics calculation
  const values = readings.map((r) => Number(r.value_mgdl))
  const count = readings.length
  const maxVal = count > 0 ? Math.max(...values) : null
  const minVal = count > 0 ? Math.min(...values) : null
  const avgVal = count > 0 ? (values.reduce((a, b) => a + b, 0) / count).toFixed(1) : null
  const inTargetCount = readings.filter((r) => {
    const s = getGlucoseStatus(r.value_mgdl, r.time_slot)
    return s.status === 'target'
  }).length

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Daily Glucose Logbook</h1>
          <p className="page-subtitle">{fullDateDisplay}</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => handleOpenAdd('')}
          disabled={count >= 4}
        >
          <PlusIcon size={16} />
          <span>{count >= 4 ? 'Day Limit Reached (4/4)' : 'Add Reading'}</span>
        </button>
      </div>

      {/* Compliance / Daily Progress Banner */}
      <div className="compliance-banner">
        <div className="compliance-header">
          <div className="compliance-title-group">
            <CheckCircleIcon size={20} className="" style={{ color: count === 4 ? 'var(--primary)' : 'var(--slate-400)' }} />
            <div>
              <span className="compliance-status-text">
                {count === 4
                  ? 'All 4 daily readings completed'
                  : `${count} of 4 readings recorded today`}
              </span>
              <p className="compliance-helper-text">
                {count === 4
                  ? 'Excellent tracking discipline! Your daily report is ready.'
                  : `Please log ${4 - count} more slot${4 - count !== 1 ? 's' : ''} to complete today's metabolic record.`}
              </p>
            </div>
          </div>
          <div className="target-guidelines-pill">
            ADA Targets: Fasting 70–130 · Post-Meal &lt; 180 mg/dL
          </div>
        </div>

        {/* 4-segment visual track */}
        <div className="segmented-progress-track">
          {SLOTS_ORDER.map((slot, idx) => {
            const isFilled = idx < count
            return (
              <div
                key={slot}
                className={`progress-segment ${isFilled ? 'filled' : ''}`}
                title={SLOT_CONFIG[slot]?.label}
              />
            )
          })}
        </div>
      </div>

      {/* The 4 Time Slots Grid */}
      <div className="slots-grid">
        {SLOTS_ORDER.map((slotKey) => {
          const slot = SLOT_CONFIG[slotKey]
          const reading = readingBySlot(slotKey)
          const status = reading ? getGlucoseStatus(reading.value_mgdl, slotKey) : null

          return (
            <div
              key={slotKey}
              className={`slot-card ${reading ? 'slot-card-filled' : 'slot-card-empty'}`}
            >
              <div className="slot-card-header">
                <div>
                  <h3 className="slot-title">{slot.label}</h3>
                  <p className="slot-timing-hint">{slot.timing}</p>
                </div>
                {reading && (
                  <span className={`status-badge ${status.className}`}>
                    <span className="status-badge-dot" />
                    <span>{status.label}</span>
                  </span>
                )}
              </div>

              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                  <div className="spinner spinner-sm" />
                </div>
              ) : reading ? (
                <>
                  <div className="slot-value-container">
                    <div className="slot-value-row">
                      <span className="slot-numeric-value" style={{ color: 'var(--slate-900)' }}>
                        {reading.value_mgdl}
                      </span>
                      <span className="slot-unit-text">mg/dL</span>
                    </div>
                    <span style={{ fontSize: '0.725rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                      {status.description}
                    </span>
                  </div>

                  <div className="slot-footer">
                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <ClockIcon size={12} />
                      <span>Recorded</span>
                    </span>
                    <div className="slot-actions">
                      <button
                        type="button"
                        className="btn-icon btn-edit"
                        onClick={() => handleOpenEdit(reading)}
                        title="Edit reading"
                        aria-label="Edit"
                      >
                        <EditIcon size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon btn-delete"
                        onClick={() => setDeletingReading(reading)}
                        title="Delete reading"
                        aria-label="Delete"
                      >
                        <TrashIcon size={15} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  className="slot-empty-action"
                  onClick={() => handleOpenAdd(slotKey)}
                  aria-label={`Record ${slot.label}`}
                >
                  <div className="slot-empty-icon">
                    <PlusIcon size={16} />
                  </div>
                  <span className="slot-empty-label">Record Slot</span>
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Clinical Summary Bar */}
      <div className="dashboard-summary-bar">
        <div className="metric-card">
          <span className="metric-label">Daily Average</span>
          <div className="metric-value-row">
            <span className="metric-number" style={{ color: 'var(--primary)' }}>
              {avgVal ?? '—'}
            </span>
            {avgVal && <span className="metric-unit">mg/dL</span>}
          </div>
          <span className="metric-desc">
            {count > 0 ? `Across ${count} logged reading${count !== 1 ? 's' : ''}` : 'No readings yet'}
          </span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Lowest Reading</span>
          <div className="metric-value-row">
            <span className="metric-number" style={{ color: 'var(--status-low-accent)' }}>
              {minVal ?? '—'}
            </span>
            {minVal && <span className="metric-unit">mg/dL</span>}
          </div>
          <span className="metric-desc">Daily minimum peak</span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Highest Reading</span>
          <div className="metric-value-row">
            <span className="metric-number" style={{ color: 'var(--danger)' }}>
              {maxVal ?? '—'}
            </span>
            {maxVal && <span className="metric-unit">mg/dL</span>}
          </div>
          <span className="metric-desc">Daily maximum peak</span>
        </div>

        <div className="metric-card">
          <span className="metric-label">Target Compliance</span>
          <div className="metric-value-row">
            <span className="metric-number">
              {count > 0 ? `${Math.round((inTargetCount / count) * 100)}%` : '—'}
            </span>
          </div>
          <span className="metric-desc">
            {count > 0 ? `${inTargetCount} of ${count} in target range` : 'Waiting for entries'}
          </span>
        </div>
      </div>

      {/* Reading Form Modal */}
      {showForm && (
        <ReadingForm
          reading={editingReading}
          defaultDate={today}
          defaultSlot={activeSlot || 'morning_fasting'}
          onSuccess={() => {
            setShowForm(false)
            setEditingReading(null)
            setToast({
              type: 'success',
              message: editingReading
                ? 'Glucose reading updated successfully.'
                : 'Glucose reading recorded.',
            })
            fetchTodayReadings()
          }}
          onCancel={() => {
            setShowForm(false)
            setEditingReading(null)
          }}
        />
      )}

      {/* Accessible Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingReading)}
        title="Delete Glucose Reading"
        message={`Are you sure you want to delete the ${
          deletingReading ? SLOT_CONFIG[deletingReading.time_slot]?.label || deletingReading.time_slot : ''
        } reading of ${deletingReading?.value_mgdl} mg/dL? This action cannot be undone.`}
        confirmLabel="Delete Reading"
        cancelLabel="Keep Reading"
        isDestructive={true}
        isLoading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingReading(null)}
      />

      {/* Toast Feedback */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
