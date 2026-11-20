import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ReadingForm from '@/components/ReadingForm'

const mockOnSuccess = vi.fn()
const mockOnCancel = vi.fn()

// Mock fetch
global.fetch = vi.fn()

function renderForm(props = {}) {
  return render(
    <ReadingForm
      onSuccess={mockOnSuccess}
      onCancel={mockOnCancel}
      {...props}
    />
  )
}

describe('ReadingForm – Kenpath Client-Side Validation Rules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows error when value field is empty on submit', async () => {
    renderForm()
    const valueInput = screen.getByLabelText(/Glucose Value/i)
    fireEvent.change(valueInput, { target: { value: '' } })

    const submitBtn = screen.getByRole('button', { name: /Add Reading/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Please enter a glucose value.')).toBeInTheDocument()
    })

    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('shows error when value is out of range (below 40)', async () => {
    renderForm()
    const valueInput = screen.getByLabelText(/Glucose Value/i)
    fireEvent.change(valueInput, { target: { value: '10' } })

    const submitBtn = screen.getByRole('button', { name: /Add Reading/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument()
    })
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('shows error when value is out of range (above 600)', async () => {
    renderForm()
    const valueInput = screen.getByLabelText(/Glucose Value/i)
    fireEvent.change(valueInput, { target: { value: '700' } })

    const submitBtn = screen.getByRole('button', { name: /Add Reading/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Value must be between 40 and 600 mg/dl.')).toBeInTheDocument()
    })
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('shows error when date is in the future', async () => {
    renderForm()

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 5)
    const futureDateStr = futureDate.toISOString().split('T')[0]

    const dateInput = screen.getByLabelText(/Date/i)
    dateInput.removeAttribute('max')
    fireEvent.change(dateInput, { target: { value: futureDateStr } })

    const valueInput = screen.getByLabelText(/Glucose Value/i)
    fireEvent.change(valueInput, { target: { value: '100' } })

    const submitBtn = screen.getByRole('button', { name: /Add Reading/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Date cannot be in the future.')).toBeInTheDocument()
    })
    expect(mockOnSuccess).not.toHaveBeenCalled()
  })

  it('submits successfully with valid data', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, value_mgdl: 95 }),
    })

    renderForm()

    const valueInput = screen.getByLabelText(/Glucose Value/i)
    fireEvent.change(valueInput, { target: { value: '95' } })

    const submitBtn = screen.getByRole('button', { name: /Add Reading/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('calls onCancel when Cancel button is clicked', () => {
    renderForm()
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i })
    fireEvent.click(cancelBtn)
    expect(mockOnCancel).toHaveBeenCalled()
  })
})
