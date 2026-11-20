'use client'

import React, { useEffect, useRef } from 'react'
import { AlertTriangleIcon, CloseIcon } from './Icons'

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  const modalBoxRef = useRef(null)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel()
      }
      if (e.key === 'Tab' && modalBoxRef.current) {
        const focusable = modalBoxRef.current.querySelectorAll(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isLoading, onCancel])

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && !isLoading && onCancel()}>
      <div className="confirm-modal-box" role="dialog" aria-modal="true" ref={modalBoxRef}>
        <div className="confirm-modal-header">
          <div className={`confirm-icon-wrapper ${isDestructive ? 'confirm-destructive' : 'confirm-info'}`}>
            <AlertTriangleIcon size={22} />
          </div>
          <div className="confirm-header-text">
            <h3>{title}</h3>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Close"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="confirm-modal-body">
          <p>{message}</p>
        </div>

        <div className="confirm-modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${isDestructive ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
