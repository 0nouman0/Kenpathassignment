import { useState } from 'react'
import { api } from '../api'
import { formatDate } from '../lib/dates'
import { slotLabel } from '../lib/glucose'
import Modal from './Modal'

export default function ConfirmDelete({ reading, onDeleted, onCancel }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function confirm() {
    setBusy(true)
    setError('')
    try {
      await api.deleteReading(reading.id)
      onDeleted(reading)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal title="Delete this reading?" onClose={onCancel}>
      <p className="modal-text">
        {slotLabel(reading.time_slot)} on {formatDate(reading.reading_date)}:{' '}
        <strong>{reading.value_mgdl} mg/dl</strong>. This cannot be undone.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="modal-actions">
        <button type="button" className="button button-quiet" onClick={onCancel}>
          Keep it
        </button>
        <button type="button" className="button button-danger" onClick={confirm} disabled={busy}>
          {busy ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </Modal>
  )
}
