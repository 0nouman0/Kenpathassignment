import { useState } from 'react'
import { api } from '../api'
import { SLOTS, VALUE_MAX, VALUE_MIN, slotLabel, validateValue } from '../lib/glucose'
import { todayLocal } from '../lib/dates'
import Modal from './Modal'

/**
 * Add or edit a reading. Pass `reading` to edit one.
 * The same rules run here (instant feedback) and on the server (the real check).
 */
export default function ReadingForm({ reading, defaultDate, defaultSlot, onSaved, onCancel }) {
  const editing = Boolean(reading)
  const today = todayLocal()

  const [date, setDate] = useState(reading?.reading_date ?? defaultDate ?? today)
  const [slot, setSlot] = useState(reading?.time_slot ?? defaultSlot ?? SLOTS[0].value)
  const [value, setValue] = useState(reading ? String(reading.value_mgdl) : '')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const clear = (field) => setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }))

  async function handleSubmit(e) {
    e.preventDefault()

    const found = {}
    const valueError = validateValue(value)
    if (valueError) found.value_mgdl = valueError
    if (!date) found.reading_date = 'Please enter a valid date.'
    else if (date > today) found.reading_date = 'Date cannot be in the future.'
    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }

    setSaving(true)
    const payload = { reading_date: date, time_slot: slot, value_mgdl: Number(value) }
    try {
      const result = editing
        ? await api.updateReading(reading.id, payload)
        : await api.createReading(payload)
      onSaved(result.reading, editing)
    } catch (err) {
      // Show the server's message next to the field it is about, or above the buttons.
      setErrors(err.field ? { [err.field]: err.message } : { form: err.message })
      setSaving(false)
    }
  }

  return (
    <Modal title={editing ? 'Edit reading' : 'Add reading'} onClose={onCancel}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="reading-date">Date</label>
          <input
            id="reading-date"
            type="date"
            value={date}
            max={today}
            onChange={(e) => {
              setDate(e.target.value)
              clear('reading_date')
              clear('time_slot')
            }}
            aria-invalid={Boolean(errors.reading_date)}
            aria-describedby={errors.reading_date ? 'reading-date-error' : undefined}
          />
          {errors.reading_date && (
            <p className="field-error" id="reading-date-error" role="alert">
              {errors.reading_date}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="reading-slot">Time slot</label>
          <select
            id="reading-slot"
            value={slot}
            onChange={(e) => {
              setSlot(e.target.value)
              clear('time_slot')
            }}
            aria-invalid={Boolean(errors.time_slot)}
            aria-describedby={errors.time_slot ? 'reading-slot-error' : undefined}
          >
            {SLOTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {errors.time_slot && (
            <p className="field-error" id="reading-slot-error" role="alert">
              {errors.time_slot}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="reading-value">Glucose value</label>
          <div className="input-unit">
            <input
              id="reading-value"
              type="number"
              inputMode="numeric"
              min={VALUE_MIN}
              max={VALUE_MAX}
              step="1"
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                clear('value_mgdl')
              }}
              aria-invalid={Boolean(errors.value_mgdl)}
              aria-describedby={errors.value_mgdl ? 'reading-value-error' : undefined}
            />
            <span aria-hidden="true">mg/dl</span>
          </div>
          {errors.value_mgdl && (
            <p className="field-error" id="reading-value-error" role="alert">
              {errors.value_mgdl}
            </p>
          )}
        </div>

        {errors.form && (
          <p className="form-error" role="alert">
            {errors.form}
          </p>
        )}

        <div className="modal-actions">
          <button type="button" className="button button-quiet" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="button" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Save reading'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
