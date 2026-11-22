import { formatAverage } from '../lib/glucose'

/** Highest / lowest / average / count, as a plain definition list. */
export default function Stats({ stats }) {
  const none = !stats || stats.count === 0
  const cell = (label, value, unit) => (
    <div>
      <dt>{label}</dt>
      <dd>
        {none ? '–' : value}
        {!none && unit && <span className="unit">{unit}</span>}
      </dd>
    </div>
  )

  return (
    <dl className="stats">
      {cell('Highest', stats?.highest, 'mg/dl')}
      {cell('Lowest', stats?.lowest, 'mg/dl')}
      {cell('Average', formatAverage(stats?.average), 'mg/dl')}
      {cell('Readings', stats?.count, '')}
    </dl>
  )
}
