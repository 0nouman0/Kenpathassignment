import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import { formatDate, todayLocal } from '../lib/dates'
import { slotLabel } from '../lib/glucose'
import ReadingForm from '../components/ReadingForm'
import ConfirmDelete from '../components/ConfirmDelete'
import Status from '../components/Status'
import { useToast } from '../components/Toast'

const PAGE_SIZE = 15

export default function Readings() {
  const toast = useToast()
  const [date, setDate] = useState('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState(null)
  const [state, setState] = useState('loading')
  const [form, setForm] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async () => {
    try {
      const res = await api.listReadings({ page, limit: PAGE_SIZE, date })
      // If the last row of the last page was just deleted, step back a page.
      if (res.data.length === 0 && page > 1) {
        setPage(page - 1)
        return
      }
      setResult(res)
      setState('ready')
    } catch {
      setState('error')
    }
  }, [page, date])

  useEffect(() => {
    load()
  }, [load])

  const rows = result?.data ?? []
  const pagination = result?.pagination

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">History</p>
          <h1>Readings</h1>
        </div>
        <button type="button" className="button" onClick={() => setForm({})}>
          Add reading
        </button>
      </div>

      <div className="toolbar">
        <div className="field field-inline">
          <label htmlFor="filter-date">Show date</label>
          <input
            id="filter-date"
            type="date"
            value={date}
            max={todayLocal()}
            onChange={(e) => {
              setDate(e.target.value)
              setPage(1)
            }}
          />
        </div>
        {date && (
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setDate('')
              setPage(1)
            }}
          >
            Show all dates
          </button>
        )}
        {pagination && (
          <p className="muted toolbar-count">
            {pagination.total} {pagination.total === 1 ? 'reading' : 'readings'}
          </p>
        )}
      </div>

      {state === 'error' && (
        <p className="notice" role="alert">
          Could not load readings.{' '}
          <button type="button" className="link-button" onClick={load}>
            Try again
          </button>
        </p>
      )}

      {state === 'loading' && <p className="muted">Loading…</p>}

      {state === 'ready' && rows.length === 0 && (
        <div className="empty">
          <p>{date ? 'No readings on this date.' : 'No readings yet.'}</p>
          <button type="button" className="link-button" onClick={() => setForm({})}>
            Add the first one
          </button>
        </div>
      )}

      {state === 'ready' && rows.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Time slot</th>
                <th scope="col" className="num">
                  mg/dl
                </th>
                <th scope="col">Range</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.reading_date)}</td>
                  <td>{slotLabel(r.time_slot)}</td>
                  <td className="num strong">{r.value_mgdl}</td>
                  <td>
                    <Status value={r.value_mgdl} slot={r.time_slot} />
                  </td>
                  <td className="actions-cell">
                    <button type="button" className="link-button" onClick={() => setForm({ reading: r })}>
                      Edit
                      <span className="visually-hidden"> reading from {formatDate(r.reading_date)}</span>
                    </button>
                    <button type="button" className="link-button danger" onClick={() => setDeleting(r)}>
                      Delete
                      <span className="visually-hidden"> reading from {formatDate(r.reading_date)}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <nav className="pager" aria-label="Pagination">
          <button
            type="button"
            className="button button-quiet"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span className="muted">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            className="button button-quiet"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </nav>
      )}

      {form && (
        <ReadingForm
          reading={form.reading}
          defaultDate={date || todayLocal()}
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
