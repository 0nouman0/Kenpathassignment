import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ReadingForm from '../components/ReadingForm'
import { api } from '../api'
import { ApiError } from '../api'

function setup(props = {}) {
  const onSaved = vi.fn()
  const onCancel = vi.fn()
  render(
    <ReadingForm defaultDate="2026-10-15" defaultSlot="after_lunch" onSaved={onSaved} onCancel={onCancel} {...props} />
  )
  return { onSaved, onCancel, user: userEvent.setup() }
}

describe('ReadingForm validation', () => {
  it('asks for a value when it is empty, without calling the API', async () => {
    const create = vi.spyOn(api, 'createReading')
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Save reading' }))
    expect(await screen.findByText('Please enter a glucose value.')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
  })

  it.each(['39', '601', '95.5'])('rejects %s as out of range or not a whole number', async (bad) => {
    const create = vi.spyOn(api, 'createReading')
    const { user } = setup()
    await user.type(screen.getByLabelText('Glucose value'), bad)
    await user.click(screen.getByRole('button', { name: 'Save reading' }))
    expect(await screen.findByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
  })

  it('rejects a date in the future', async () => {
    const create = vi.spyOn(api, 'createReading')
    const { user } = setup({ defaultDate: '2999-01-01' })
    await user.type(screen.getByLabelText('Glucose value'), '100')
    await user.click(screen.getByRole('button', { name: 'Save reading' }))
    expect(await screen.findByText('Date cannot be in the future.')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
  })

  it('clears the message once the value is edited', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Save reading' }))
    await screen.findByText('Please enter a glucose value.')
    await user.type(screen.getByLabelText('Glucose value'), '1')
    expect(screen.queryByText('Please enter a glucose value.')).not.toBeInTheDocument()
  })
})

describe('ReadingForm submit', () => {
  it('sends the reading and reports success', async () => {
    const saved = { id: 1, reading_date: '2026-10-15', time_slot: 'after_lunch', value_mgdl: 132 }
    const create = vi.spyOn(api, 'createReading').mockResolvedValue({ reading: saved })
    const { user, onSaved } = setup()

    await user.type(screen.getByLabelText('Glucose value'), '132')
    await user.click(screen.getByRole('button', { name: 'Save reading' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(saved, false))
    expect(create).toHaveBeenCalledWith({
      reading_date: '2026-10-15',
      time_slot: 'after_lunch',
      value_mgdl: 132,
    })
  })

  it("shows the server's duplicate-slot message next to the time slot", async () => {
    vi.spyOn(api, 'createReading').mockRejectedValue(
      new ApiError('You already have an After lunch reading for this date.', {
        status: 400,
        field: 'time_slot',
      })
    )
    const { user, onSaved } = setup()
    await user.type(screen.getByLabelText('Glucose value'), '120')
    await user.click(screen.getByRole('button', { name: 'Save reading' }))

    expect(
      await screen.findByText('You already have an After lunch reading for this date.')
    ).toBeInTheDocument()
    expect(onSaved).not.toHaveBeenCalled()
  })

  it('pre-fills and updates when editing', async () => {
    const existing = { id: 7, reading_date: '2026-10-15', time_slot: 'morning', value_mgdl: 99 }
    const update = vi
      .spyOn(api, 'updateReading')
      .mockResolvedValue({ reading: { ...existing, value_mgdl: 105 } })
    const { user, onSaved } = setup({ reading: existing })

    const input = screen.getByLabelText('Glucose value')
    expect(input).toHaveValue(99)
    await user.clear(input)
    await user.type(input, '105')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(update).toHaveBeenCalledWith(7, {
      reading_date: '2026-10-15',
      time_slot: 'morning',
      value_mgdl: 105,
    })
  })

  it('closes on Cancel and on Escape', async () => {
    const { user, onCancel } = setup()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.keyboard('{Escape}')
    expect(onCancel).toHaveBeenCalledTimes(2)
  })
})
