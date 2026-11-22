import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatDayMonth } from '../lib/dates'
import { SLOTS } from '../lib/glucose'

/** One row per day: the average, plus each slot's reading under its own key. */
export function toDailyRows(readings) {
  const days = new Map()
  for (const r of readings) {
    const day = days.get(r.reading_date) ?? { date: r.reading_date, values: [] }
    day[r.time_slot] = r.value_mgdl
    day.values.push(r.value_mgdl)
    days.set(r.reading_date, day)
  }
  return [...days.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(({ values, ...day }) => ({
      ...day,
      average: Math.round(values.reduce((s, v) => s + v, 0) / values.length),
    }))
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const day = payload[0].payload
  return (
    <div className="chart-tip">
      <div className="chart-tip-head">
        <strong>{formatDayMonth(day.date)}</strong>
        <span className="chart-tip-avg">{day.average} mg/dl avg</span>
      </div>
      <div className="chart-tip-slots">
        {SLOTS.filter((s) => day[s.value] !== undefined).map((s) => (
          <div key={s.value} className="chart-tip-slot-row">
            <span>{s.label}</span>
            <strong>{day[s.value]} mg/dl</strong>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Each reading as a dot, with a line through each day's average. */
export default function TrendChart({ readings }) {
  const rows = toDailyRows(readings)
  const top = Math.ceil((Math.max(200, ...readings.map((r) => r.value_mgdl)) + 10) / 50) * 50
  const ticks = Array.from({ length: top / 50 }, (_, i) => (i + 1) * 50)

  return (
    <div className="chart-card" role="img" aria-label="Chart of this month's readings and daily averages">
      <div className="chart-header">
        <div>
          <h3>Glycemic Trajectory</h3>
          <p className="muted">Daily average trend plotted against standard ADA target bands</p>
        </div>
        <div className="chart-key">
          <span>
            <span className="key key-line" /> Average Line
          </span>
          <span>
            <span className="key key-dot" /> Slot Reading
          </span>
          <span>
            <span className="key key-band" /> Target Zone (70–180 mg/dl)
          </span>
        </div>
      </div>

      <div className="chart">
        <ResponsiveContainer width="100%" height={290}>
          <ComposedChart data={rows} margin={{ top: 12, right: 12, bottom: 0, left: -10 }}>
            <CartesianGrid stroke="var(--rule-light)" strokeDasharray="3 3" vertical={false} />
            <ReferenceArea
              y1={70}
              y2={180}
              fill="var(--ok)"
              fillOpacity={0.08}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatDayMonth}
              tick={{ fill: 'var(--muted)', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--rule)' }}
              minTickGap={24}
            />
            <YAxis
              domain={[40, top]}
              ticks={ticks}
              tick={{ fill: 'var(--muted)', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--accent)', strokeDasharray: '4 4' }} />
            {SLOTS.map((s) => (
              <Line
                key={s.value}
                dataKey={s.value}
                stroke="none"
                dot={{ r: 3, fill: 'var(--slate)', fillOpacity: 0.7, stroke: 'none' }}
                activeDot={{ r: 4, fill: 'var(--teal)' }}
                isAnimationActive={false}
                legendType="none"
              />
            ))}
            <Line
              dataKey="average"
              stroke="var(--accent)"
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: 'var(--accent)' }}
              activeDot={{ r: 5, fill: 'var(--teal-light)' }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
