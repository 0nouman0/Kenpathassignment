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
import { useAuth } from '../auth'

function getSlotIcon(slotValue) {
  switch (slotValue) {
    case 'morning':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v6" />
          <path d="M4.93 10.93l4.24 4.24" />
          <path d="M2 18h20" />
          <path d="M20 18a8 8 0 1 0-16 0" />
        </svg>
      )
    case 'after_breakfast':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      )
    case 'after_lunch':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )
    case 'after_dinner':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )
    default:
      return null
  }
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Today() {
  const today = todayLocal()
  const toast = useToast()
  const { user } = useAuth()
  const [readings, setReadings] = useState([])
  const [state, setState] = useState('loading')
  const [form, setForm] = useState(null)
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
  const progressPercent = Math.min(100, Math.round((readings.length / 4) * 100))

  return (
    <>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <p className="eyebrow">{getGreeting()}{user?.name ? `, ${user.name}` : ''}</p>
          <h1>{formatLong(today)}</h1>
        </div>
        <button
          type="button"
          className="button"
          disabled={full || state !== 'ready'}
          onClick={() => setForm({ slot: firstOpenSlot })}
        >
          {full ? 'All 4 Recorded' : '+ Add Reading'}
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

      {/* Daily Progress Widget */}
      <div className="daily-progress-card">
        <div className="progress-info">
          <div>
            <span className="progress-title">Daily Protocol Progress</span>
            <span className="progress-sub">
              {state === 'ready'
                ? `${readings.length} of 4 metabolic slots logged`
                : 'Loading progress…'}
            </span>
          </div>
          <span className="progress-pill">
            {full ? 'Complete' : `${4 - readings.length} remaining`}
          </span>
        </div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Ledger Cards */}
      <ol className="ledger" aria-label="Today's readings">
        {SLOTS.map((slot) => {
          const reading = bySlot[slot.value]
          return (
            <li
              key={slot.value}
              className={`ledger-row ${reading ? 'is-recorded' : 'is-empty'}`}
            >
              <div className="ledger-slot">
                <div className="slot-badge">
                  <span className="slot-icon" aria-hidden="true">
                    {getSlotIcon(slot.value)}
                  </span>
                  <div>
                    <h2>{slot.label}</h2>
                    <p className="muted">{slot.hint}</p>
                  </div>
                </div>
              </div>

              {reading ? (
                <>
                  <div className="ledger-value-wrap">
                    <p className="ledger-value">
                      {reading.value_mgdl}
                      <span className="unit">mg/dl</span>
                    </p>
                  </div>
                  <div className="ledger-status">
                    <Status value={reading.value_mgdl} slot={slot.value} />
                  </div>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => setForm({ reading })}
                    >
                      Edit
                      <span className="visually-hidden"> {slot.label} reading</span>
                    </button>
                    <button
                      type="button"
                      className="link-button danger"
                      onClick={() => setDeleting(reading)}
                    >
                      Delete
                      <span className="visually-hidden"> {slot.label} reading</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="ledger-value-wrap">
                    <p className="ledger-value ledger-none">Not recorded</p>
                  </div>
                  <div className="ledger-status">
                    <span className="status-pending">Pending</span>
                  </div>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="button button-quiet"
                      disabled={state !== 'ready'}
                      onClick={() => setForm({ slot: slot.value })}
                    >
                      + Record
                      <span className="visually-hidden"> {slot.label} reading</span>
                    </button>
                  </div>
                </>
              )}
            </li>
          )
        })}
      </ol>

      {/* Summary Section */}
      <section className="section" aria-labelledby="today-summary">
        <h2 id="today-summary" className="section-title">
          Today&rsquo;s Overview
        </h2>
        {readings.length === 0 && state === 'ready' ? (
          <div className="empty">
            <p>Nothing recorded yet today. Start with your morning fasting reading when ready.</p>
          </div>
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
