import { classify } from '../lib/glucose'

/** Colour plus a word, so the meaning never depends on colour alone. */
export default function Status({ value, slot }) {
  const { key, label } = classify(value, slot)
  return (
    <span className={`status status-${key}`}>
      <span className="status-mark" aria-hidden="true" />
      {label}
    </span>
  )
}
