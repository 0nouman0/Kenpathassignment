import { useEffect, useRef } from 'react'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/** Accessible modal: closes on Escape or backdrop click, keeps Tab inside, restores focus. */
export default function Modal({ title, onClose, children }) {
  const panel = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const previous = document.activeElement
    const node = panel.current
    // Prefer the first form field over the close button.
    const first = node.querySelector('input, select, textarea') || node.querySelector(FOCUSABLE)
    first?.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') {
        onCloseRef.current()
      } else if (e.key === 'Tab') {
        const items = [...node.querySelectorAll(FOCUSABLE)].filter((el) => !el.disabled)
        if (items.length === 0) return
        const [head, tail] = [items[0], items[items.length - 1]]
        if (e.shiftKey && document.activeElement === head) {
          e.preventDefault()
          tail.focus()
        } else if (!e.shiftKey && document.activeElement === tail) {
          e.preventDefault()
          head.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      previous?.focus?.()
    }
  }, [])

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={panel}>
        <div className="modal-head">
          <h2 id="modal-title">{title}</h2>
          <button type="button" className="link-button" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
