import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import { SLOTS } from '../lib/glucose'
import { formatLong, todayLocal } from '../lib/dates'
import ReadingForm from '../components/ReadingForm'
import ConfirmDelete from '../components/ConfirmDelete'
import Status from '../components/Status'
import Stats from '../components/Stats'
import { useToast } from '../components/Toast'
import { summarize } from '../lib/summary'

export default function Today() {
  const today = todayLocal()
  const toast = useToast()
  const [readings, setReadings] = useState([])
  const [state, setState] = useState('loading') // loading | ready | error
  const [form, setForm] = useState(null) // { reading?, slot? }
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async () => {
    try {
      const res = await api.listReadings({ date: today, limit: 10 })
      setReadings(res.data)
      setState('ready')
    } catch {
      setState('error')
    }
  }, [today])

  useEffect(() => {
    load()
  }, [load])

  const bySlot = Object.fromEntries(readings.map((r) => [r.time_slot, r]))
  const firstOpenSlot = SLOTS.find((s) => !bySlot[s.value])?.value
  const full = readings.length >= 4

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Today</p>
          <h1>{formatLong(today)}</h1>
        </div>
        <button
          type="button"
          className="button"
          disabled={full || state !== 'ready'}
          onClick={() => setForm({ slot: firstOpenSlot })}
        >
          {full ? 'All four recorded' : 'Add reading'}
        </button>
      </div>

      {state === 'error' && (
        <p className="notice" role="alert">
          Could not load today&rsquo;s readings.{' '}
          <button type="button" className="link-button" onClick={load}>
            Try again
          </button>
        </p>
      )}

      <p className="muted progress">
        {state === 'ready' ? `${readings.length} of 4 readings recorded` : 'Loading…'}
      </p>

      <ol className="ledger" aria-label="Today's readings">
        {SLOTS.map((slot) => {
          const reading = bySlot[slot.value]
          return (
            <li key={slot.value} className={`ledger-row ${reading ? '' : 'is-empty'}`}>
              <div className="ledger-slot">
                <h2>{slot.label}</h2>
                <p className="muted">{slot.hint}</p>
              </div>

              {reading ? (
                <>
                  <p className="ledger-value">
                    {reading.value_mgdl}
                    <span className="unit">mg/dl</span>
                  </p>
                  <div className="ledger-status">
                    <Status value={reading.value_mgdl} slot={slot.value} />
                  </div>
                  <div className="row-actions">
                    <button type="button" className="link-button" onClick={() => setForm({ reading })}>
                      Edit
                      <span className="visually-hidden"> {slot.label} reading</span>
                    </button>
                    <button type="button" className="link-button danger" onClick={() => setDeleting(reading)}>
                      Delete
                      <span className="visually-hidden"> {slot.label} reading</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="ledger-value ledger-none">Not recorded</p>
                  <div className="ledger-status" />
                  <div className="row-actions">
                    <button
                      type="button"
                      className="link-button"
                      disabled={state !== 'ready'}
                      onClick={() => setForm({ slot: slot.value })}
                    >
                      Record
                      <span className="visually-hidden"> {slot.label} reading</span>
                    </button>
                  </div>
                </>
              )}
            </li>
          )
        })}
      </ol>

      <section className="section" aria-labelledby="today-summary">
        <h2 id="today-summary" className="section-title">
          Today so far
        </h2>
        {readings.length === 0 && state === 'ready' ? (
          <p className="empty">
            Nothing recorded yet today. Start with your morning reading when you are ready.
          </p>
        ) : (
          <Stats stats={summarize(readings)} />
        )}
      </section>

      {form && (
        <ReadingForm
          reading={form.reading}
          defaultDate={today}
          defaultSlot={form.slot}
          onCancel={() => setForm(null)}
          onSaved={(_, wasEdit) => {
            setForm(null)
            toast(wasEdit ? 'Reading updated.' : 'Reading saved.')
            load()
          }}
        />
      )}
      {deleting && (
        <ConfirmDelete
          reading={deleting}
          onCancel={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null)
            toast('Reading deleted.')
            load()
          }}
        />
      )}
    </>
  )
}
