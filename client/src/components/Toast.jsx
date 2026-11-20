import React, { useEffect } from 'react'
import { CheckCircleIcon, AlertTriangleIcon, CloseIcon } from './Icons'

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => {
      onClose()
    }, toast.duration || 4000)
    return () => clearTimeout(timer)
  }, [toast, onClose])

  if (!toast) return null

  const isError = toast.type === 'error'

  return (
    <div className={`toast-container ${isError ? 'toast-error' : 'toast-success'}`} role="status">
      <div className="toast-icon">
        {isError ? <AlertTriangleIcon size={18} /> : <CheckCircleIcon size={18} />}
      </div>
      <div className="toast-message">{toast.message}</div>
      <button className="toast-close" onClick={onClose} aria-label="Dismiss">
        <CloseIcon size={14} />
      </button>
    </div>
  )
}
