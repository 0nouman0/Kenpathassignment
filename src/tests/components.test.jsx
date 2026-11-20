import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import ConfirmModal from '../components/ConfirmModal'
import Toast from '../components/Toast'

describe('ConfirmModal Component Tests', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ConfirmModal isOpen={false} onConfirm={() => {}} onCancel={() => {}} message="Delete reading?" />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders modal dialog with aria-modal and message', () => {
    render(
      <ConfirmModal isOpen={true} onConfirm={() => {}} onCancel={() => {}} message="Are you sure you want to delete this reading?" />
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText('Are you sure you want to delete this reading?')).toBeInTheDocument()
  })

  it('calls onCancel when Escape key is pressed', () => {
    const handleCancel = vi.fn()
    render(
      <ConfirmModal isOpen={true} onConfirm={() => {}} onCancel={handleCancel} message="Delete reading?" />
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(handleCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onConfirm when confirm button is clicked', () => {
    const handleConfirm = vi.fn()
    render(
      <ConfirmModal
        isOpen={true}
        confirmLabel="Confirm Delete"
        onConfirm={handleConfirm}
        onCancel={() => {}}
        message="Delete reading?"
      />
    )
    const confirmBtn = screen.getByRole('button', { name: 'Confirm Delete' })
    fireEvent.click(confirmBtn)
    expect(handleConfirm).toHaveBeenCalledTimes(1)
  })

  it('traps focus inside the modal dialog on Tab key', async () => {
    render(
      <ConfirmModal
        isOpen={true}
        onConfirm={() => {}}
        onCancel={() => {}}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        message="Delete reading?"
      />
    )
    const buttons = screen.getAllByRole('button') // Close, Cancel, Confirm
    const firstBtn = buttons[0]
    const lastBtn = buttons[buttons.length - 1]

    firstBtn.focus()
    expect(document.activeElement).toBe(firstBtn)

    // Shift+Tab from first button wraps to last
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(lastBtn)

    // Tab from last button wraps to first
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: false })
    expect(document.activeElement).toBe(firstBtn)
  })
})

describe('Toast Component Tests', () => {
  it('renders nothing when toast is null', () => {
    const { container } = render(<Toast toast={null} onClose={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders with role="status" and correct aria-live for success and error', () => {
    const { rerender } = render(
      <Toast toast={{ message: 'Reading saved successfully', type: 'success' }} onClose={() => {}} />
    )
    let toastEl = screen.getByRole('status')
    expect(toastEl).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByText('Reading saved successfully')).toBeInTheDocument()

    rerender(
      <Toast toast={{ message: 'Network error occurred', type: 'error' }} onClose={() => {}} />
    )
    toastEl = screen.getByRole('status')
    expect(toastEl).toHaveAttribute('aria-live', 'assertive')
    expect(screen.getByText('Network error occurred')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn()
    render(
      <Toast toast={{ message: 'Reading updated', type: 'success' }} onClose={handleClose} />
    )
    const closeBtn = screen.getByRole('button', { name: /dismiss/i })
    fireEvent.click(closeBtn)
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
