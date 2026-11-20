'use client'

import { useState, useEffect } from 'react'
import { CloseIcon, AlertTriangleIcon } from './Icons'
import { getGlucoseStatus, SLOT_CONFIG } from '@/lib/glucose'

const TIME_SLOTS = [
  { value: 'morning_fasting', label: 'Morning (fasting)' },
  { value: 'after_breakfast', label: 'After breakfast' },
  { value: 'after_lunch', label: 'After lunch' },
  { value: 'after_dinner', label: 'After dinner' },
]

const todayStr = () => {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

export default function ReadingForm({
  reading = null,
  defaultDate = '',
  defaultSlot = '',
  token = '',
  onSuccess,
  onCancel,
}) {
  const [form, setForm] = useState({
    reading_date: reading?.reading_date || defaultDate || todayStr(),
    time_slot: reading?.time_slot || defaultSlot || 'morning_fasting',
    value_mgdl: reading?.value_mgdl ?? '',
  })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (reading) {
      setForm({
        reading_date: reading.reading_date,
        time_slot: reading.time_slot,
        value_mgdl: reading.value_mgdl,
      })
    }
  }, [reading])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  const validate = () => {
    const errs = {}
    if (form.value_mgdl === '' || form.value_mgdl === null || form.value_mgdl === undefined) {
      errs.value_mgdl = 'Please enter a glucose value.'
    } else {
      const val = Number(form.value_mgdl)
      if (isNaN(val) || val < 40 || val > 600 || !Number.isInteger(val)) {
        errs.value_mgdl = 'Value must be between 40 and 600 mg/dl.'
      }
    }

    if (!form.reading_date) {
      errs.reading_date = 'Please select a date.'
    } else if (form.reading_date > todayStr()) {
      errs.reading_date = 'Date cannot be in the future.'
    }

    return errs
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setFormError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setSubmitting(true)
    setFormError('')

    try {
      const payload = {
        reading_date: form.reading_date,
        time_slot: form.time_slot,
        value_mgdl: parseInt(form.value_mgdl, 10),
      }

      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const url = reading ? `/api/readings/${reading.id}` : '/api/readings'
      const method = reading ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error || 'Failed to save reading.')
        return
      }

      onSuccess()
    } catch {
      setFormError('Network error. Failed to save reading.')
    } finally {
      setSubmitting(false)
    }
  }

  const numericVal = Number(form.value_mgdl)
  const previewStatus = !isNaN(numericVal) && numericVal >= 40 && numericVal <= 600
    ? getGlucoseStatus(numericVal, form.time_slot)
    : null

  const selectedSlotConfig = SLOT_CONFIG[form.time_slot]

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && !submitting && onCancel()}
    >
      <div className="modal-box" role="dialog" aria-modal="true" aria-labelledby="form-modal-title">
        <div className="modal-header">
          <h2 id="form-modal-title">{reading ? 'Edit Glucose Reading' : 'Add Glucose Reading'}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onCancel}
            disabled={submitting}
            aria-label="Close"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="reading-form" noValidate>
          {formError && (
            <div className="form-error-banner" role="alert">
              <AlertTriangleIcon size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="reading_date">Date</label>
            <input
              id="reading_date"
              type="date"
              name="reading_date"
              value={form.reading_date}
              max={todayStr()}
              onChange={handleChange}
              className={errors.reading_date ? 'input-error' : ''}
            />
            {errors.reading_date && (
              <span className="field-error" role="alert">{errors.reading_date}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="time_slot">Time Slot</label>
            <select
              id="time_slot"
              name="time_slot"
              value={form.time_slot}
              onChange={handleChange}
              className={errors.time_slot ? 'input-error' : ''}
            >
              {TIME_SLOTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            {selectedSlotConfig && (
              <span style={{ fontSize: '0.725rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                Recommended timing: {selectedSlotConfig.timing}
              </span>
            )}
            {errors.time_slot && (
              <span className="field-error" role="alert">{errors.time_slot}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="value_mgdl">Glucose Value (mg/dL)</label>
            <input
              id="value_mgdl"
              type="number"
              name="value_mgdl"
              value={form.value_mgdl}
              onChange={handleChange}
              placeholder="e.g. 95"
              min="40"
              max="600"
              step="1"
              autoFocus={!reading}
              className={errors.value_mgdl ? 'input-error' : ''}
            />
            {errors.value_mgdl && (
              <span className="field-error" role="alert">{errors.value_mgdl}</span>
            )}

            {previewStatus && !errors.value_mgdl && (
              <div className={`clinical-preview-pill ${previewStatus.className}`}>
                <span>● {previewStatus.label}: {previewStatus.description}</span>
                <span style={{ fontWeight: 600 }}>{numericVal} mg/dL</span>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : reading ? 'Update Reading' : 'Add Reading'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
