import React from 'react'
import { ActivityIcon } from './Icons'

export default function EmptyState({
  title = 'No records found',
  message = 'No blood glucose readings recorded yet.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon-wrapper">
        <ActivityIcon size={24} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
      {actionLabel && onAction && (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
