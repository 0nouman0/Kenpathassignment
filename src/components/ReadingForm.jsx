'use client'

import { useState, useEffect } from 'react'
import { CloseIcon, AlertTriangleIcon } from './Icons'
import { getGlucoseStatus, SLOT_CONFIG, getDefaultSlotForCurrentTime } from '@/lib/glucose'
import { PRESET_TAGS } from '@/config/clinical'

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
    time_slot: reading?.time_slot || defaultSlot || getDefaultSlotForCurrentTime(),
    value_mgdl: reading?.value_mgdl ?? '',
    notes: reading?.notes || '',
    tags: reading?.tags || [],
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
        notes: reading.notes || '',
        tags: reading.tags || [],
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

  const handleToggleTag = (tagId) => {
    setForm((prev) => {
      const currentTags = prev.tags || []
      const nextTags = currentTags.includes(tagId)
        ? currentTags.filter((t) => t !== tagId)
        : [...currentTags, tagId]
      return { ...prev, tags: nextTags }
    })
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
        notes: form.notes ? form.notes.trim() : null,
        tags: form.tags || [],
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
              aria-describedby={errors.reading_date ? 'date-error-msg' : undefined}
              className={errors.reading_date ? 'input-error' : ''}
            />
            {errors.reading_date && (
              <span id="date-error-msg" className="field-error" role="alert">{errors.reading_date}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="time_slot">Time Slot</label>
            <select
              id="time_slot"
              name="time_slot"
              value={form.time_slot}
              onChange={handleChange}
              aria-describedby={errors.time_slot ? 'slot-error-msg' : undefined}
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
              <span id="slot-error-msg" className="field-error" role="alert">{errors.time_slot}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="value_mgdl">Glucose Value (mg/dL)</label>
            <input
              id="value_mgdl"
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              name="value_mgdl"
              value={form.value_mgdl}
              onChange={handleChange}
              placeholder="e.g. 95"
              min="40"
              max="600"
              step="1"
              autoFocus={!reading}
              aria-describedby={errors.value_mgdl ? 'value-error-msg' : undefined}
              className={errors.value_mgdl ? 'input-error' : ''}
            />
            {errors.value_mgdl && (
              <span id="value-error-msg" className="field-error" role="alert">{errors.value_mgdl}</span>
            )}

            {previewStatus && !errors.value_mgdl && (
              <div className={`clinical-preview-pill ${previewStatus.className}`} role="status" aria-live="polite">
                <span>● {previewStatus.label}: {previewStatus.description}</span>
                <span style={{ fontWeight: 600 }}>{numericVal} mg/dL</span>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Context Tags (Optional)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              {PRESET_TAGS.map((tag) => {
                const isSelected = form.tags?.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleToggleTag(tag.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      border: isSelected ? '1px solid #0d9488' : '1px solid #cbd5e1',
                      background: isSelected ? '#f0fdfa' : '#ffffff',
                      color: isSelected ? '#115e59' : '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isSelected ? '✓ ' : '+ '}{tag.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="notes">Clinical Note (Optional)</label>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                {(form.notes || '').length}/200
              </span>
            </div>
            <textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              maxLength={200}
              placeholder="e.g. Post-workout reading, light breakfast"
              rows={2}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
                resize: 'none',
              }}
            />
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
