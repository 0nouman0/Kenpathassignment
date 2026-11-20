'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import ReadingList from '@/components/ReadingList'
import ReadingForm from '@/components/ReadingForm'
import ConfirmModal from '@/components/ConfirmModal'
import Toast from '@/components/Toast'
import { TableSkeleton } from '@/components/Skeletons'
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from '@/components/Icons'
import { PRESET_TAGS } from '@/config/clinical'
import { SLOT_DISPLAY_NAMES } from '@/lib/validations'
import { getGlucoseStatus } from '@/lib/glucose'

const todayStr = () => new Date().toISOString().split('T')[0]

const yesterdayStr = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

export default function ReadingsPage() {
  const { user, token, loading: authLoading } = useAuth()
  const router = useRouter()
  const [readings, setReadings] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState('')
  const [tag, setTag] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editReading, setEditReading] = useState(null)
  const [deletingReading, setDeletingReading] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const LIMIT = 10

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  const fetchReadings = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      let url = `/api/readings?page=${page}&limit=${LIMIT}`
      if (date) url += `&date=${date}`
      if (tag) url += `&tag=${tag}`

      const res = await fetch(url, { headers })
      if (res.ok) {
        const data = await res.json()
        const rows = data.data || data.readings || []
        const totalCount = data.pagination?.total ?? data.total ?? rows.length
        setReadings(rows)
        setTotal(totalCount)
      }
    } catch {
      setReadings([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [date, tag, page, user, token])

  useEffect(() => {
    if (user) {
      fetchReadings()
    }
  }, [user, fetchReadings])

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
    const idToDelete = deletingReading.id
    const prevReadings = [...readings]
    const prevTotal = total

    // Optimistically update list
    setReadings((prev) => prev.filter((r) => r.id !== idToDelete))
    setTotal((prev) => Math.max(0, prev - 1))
    setDeletingReading(null)
    setDeleteLoading(true)

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(`/api/readings/${idToDelete}`, {
        method: 'DELETE',
        headers,
      })
      if (res.ok) {
        setToast({ type: 'success', message: 'Reading successfully deleted.' })
      } else {
        // Rollback
        setReadings(prevReadings)
        setTotal(prevTotal)
        const data = await res.json()
        setToast({ type: 'error', message: data.error || 'Failed to delete reading.' })
      }
    } catch {
      // Rollback
      setReadings(prevReadings)
      setTotal(prevTotal)
      setToast({ type: 'error', message: 'Failed to delete reading.' })
    } finally {
      setDeleteLoading(false)
    }
  }

  if (authLoading || (!user && typeof window !== 'undefined')) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Loading readings…</p>
      </div>
    )
  }

  const totalPages = Math.ceil(total / LIMIT) || 1

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Readings History</h1>
          <p className="page-subtitle">Complete chronological log of blood glucose records</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              if (!readings || readings.length === 0) return
              const headers = ['Date', 'Time Slot', 'Value (mg/dL)', 'Value (mmol/L)', 'Clinical Status', 'Tags', 'Notes']
              const csvRows = readings.map((r) => [
                r.reading_date,
                SLOT_DISPLAY_NAMES[r.time_slot] || r.time_slot,
                r.value_mgdl,
                (r.value_mgdl / 18.016).toFixed(1),
                getGlucoseStatus(r.value_mgdl, r.time_slot).label,
                `"${(r.tags || []).join('; ')}"`,
                `"${(r.notes || '').replace(/"/g, '""')}"`,
              ])
              const csv = [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n')
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `sweety_readings_${new Date().toISOString().slice(0, 10)}.csv`
              a.click()
              URL.revokeObjectURL(url)
            }}
            title="Download CSV export of records"
          >
            Export CSV
          </button>
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

          <div className="filter-input-group" style={{ marginLeft: '8px' }}>
            <label htmlFor="filter-tag">Tag:</label>
            <select
              id="filter-tag"
              value={tag}
              onChange={(e) => {
                setTag(e.target.value)
                setPage(1)
              }}
              style={{ padding: '6px 10px', fontSize: '0.8125rem', borderRadius: '4px', border: '1px solid var(--slate-300)' }}
            >
              <option value="">All Contexts</option>
              {PRESET_TAGS.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="result-count-badge">
          {total} record{total !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Reading Table */}
      {loading ? (
        <TableSkeleton rows={LIMIT} />
      ) : (
        <ReadingList
          readings={readings}
          loading={false}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
        />
      )}

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
          token={token}
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
