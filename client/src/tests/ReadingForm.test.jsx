import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReadingForm from '../components/ReadingForm'

// Mock the readings API so network calls don't fire
vi.mock('../api/readings', () => ({
  createReading: vi.fn(),
  updateReading: vi.fn(),
}))

const mockOnSuccess = vi.fn()
const mockOnCancel = vi.fn()

function renderForm(props = {}) {
  return render(
    <ReadingForm
      onSuccess={mockOnSuccess}
      onCancel={mockOnCancel}
      {...props}
    />
  )
}

describe('ReadingForm – client-side validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows error when value field is empty on submit', async () => {
    renderForm()
    // Clear value field (it may start empty)
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

    // Set a future date
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 5)
    const futureDateStr = futureDate.toISOString().split('T')[0]

    const dateInput = screen.getByLabelText(/Date/i)
    // We need to remove the max attribute to allow setting future date in test
    dateInput.removeAttribute('max')
    fireEvent.change(dateInput, { target: { value: futureDateStr } })

    // Set a valid value so only the date error shows
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
    const { createReading } = await import('../api/readings')
    createReading.mockResolvedValueOnce({ data: { id: 1 } })

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
