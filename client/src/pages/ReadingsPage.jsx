import { useState, useEffect, useCallback } from 'react'
import { getReadings, deleteReading } from '../api/readings'
import ReadingList from '../components/ReadingList'
import ReadingForm from '../components/ReadingForm'
import ConfirmModal from '../components/ConfirmModal'
import Toast from '../components/Toast'
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '../components/Icons'

const todayStr = () => new Date().toISOString().split('T')[0]

const yesterdayStr = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

export default function ReadingsPage() {
  const [readings, setReadings] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editReading, setEditReading] = useState(null)
  const [deletingReading, setDeletingReading] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const LIMIT = 10

  const fetchReadings = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: LIMIT }
      if (date) params.date = date
      const res = await getReadings(params)
      const data = res.data
      const rows = data.data || data.readings || []
      const totalCount = data.pagination?.total ?? data.total ?? rows.length
      setReadings(rows)
      setTotal(totalCount)
    } catch {
      setReadings([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [date, page])

  useEffect(() => {
    fetchReadings()
  }, [fetchReadings])

  const handleDateChange = (e) => {
    setDate(e.target.value)
    setPage(1)
  }

  const handleEdit = (reading) => {
    setEditReading(reading)
    setShowForm(true)
  }

  const handleDeleteRequest = (reading) => {
    setDeletingReading(reading)
  }

  const handleConfirmDelete = async () => {
    if (!deletingReading) return
    setDeleteLoading(true)
    try {
      await deleteReading(deletingReading.id)
      setToast({ type: 'success', message: 'Reading successfully deleted.' })
      setDeletingReading(null)
      fetchReadings()
    } catch (err) {
      setToast({
        type: 'error',
        message: err.response?.data?.error || 'Failed to delete reading.',
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const totalPages = Math.ceil(total / LIMIT) || 1

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Readings History</h1>
          <p className="page-subtitle">Complete chronological log of blood glucose records</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setEditReading(null)
            setShowForm(true)
          }}
        >
          <PlusIcon size={16} />
          <span>Add Reading</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-left">
          <div className="filter-input-group">
            <CalendarIcon size={16} style={{ color: 'var(--slate-500)' }} />
            <label htmlFor="filter-date">Date filter:</label>
            <input
              id="filter-date"
              type="date"
              value={date}
              max={todayStr()}
              onChange={handleDateChange}
              style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8125rem' }}
            />
          </div>

          <div className="filter-presets">
            <button
              type="button"
              className={`filter-preset-btn ${date === todayStr() ? 'active' : ''}`}
              onClick={() => {
                setDate(todayStr())
                setPage(1)
              }}
            >
              Today
            </button>
            <button
              type="button"
              className={`filter-preset-btn ${date === yesterdayStr() ? 'active' : ''}`}
              onClick={() => {
                setDate(yesterdayStr())
                setPage(1)
              }}
            >
              Yesterday
            </button>
            <button
              type="button"
              className={`filter-preset-btn ${date === '' ? 'active' : ''}`}
              onClick={() => {
                setDate('')
                setPage(1)
              }}
            >
              All Records
            </button>
          </div>
        </div>

        <div className="result-count-badge">
          {total} record{total !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Reading Table */}
      <ReadingList
        readings={readings}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
      />

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="pagination-bar">
          <div className="pagination-info">
            Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total readings)
          </div>
          <div className="pagination-controls">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeftIcon size={14} />
              <span>Previous</span>
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <span>Next</span>
              <ChevronRightIcon size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {showForm && (
        <ReadingForm
          reading={editReading}
          defaultDate={date || todayStr()}
          onSuccess={() => {
            setShowForm(false)
            setEditReading(null)
            setToast({
              type: 'success',
              message: editReading ? 'Reading updated.' : 'Reading created.',
            })
            fetchReadings()
          }}
          onCancel={() => {
            setShowForm(false)
            setEditReading(null)
          }}
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingReading)}
        title="Delete Reading Record"
        message={`Delete the reading from ${deletingReading?.reading_date} (${deletingReading?.value_mgdl} mg/dL)? This action is permanent.`}
        confirmLabel="Delete"
        isDestructive={true}
        isLoading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingReading(null)}
      />

      {/* Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
