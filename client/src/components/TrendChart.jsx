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
      <strong>{formatDayMonth(day.date)}</strong>
      {SLOTS.filter((s) => day[s.value] !== undefined).map((s) => (
        <span key={s.value}>
          {s.label}: {day[s.value]}
        </span>
      ))}
      <span className="chart-tip-avg">Average: {day.average} mg/dl</span>
    </div>
  )
}

/** Each reading as a dot, with a line through each day's average. */
export default function TrendChart({ readings }) {
  const rows = toDailyRows(readings)
  const top = Math.ceil((Math.max(200, ...readings.map((r) => r.value_mgdl)) + 10) / 50) * 50
  const ticks = Array.from({ length: top / 50 }, (_, i) => (i + 1) * 50)

  return (
    <div className="chart" role="img" aria-label="Chart of this month's readings and daily averages">
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="var(--rule)" vertical={false} />
          <ReferenceArea y1={70} y2={180} fill="var(--ok)" fillOpacity={0.1} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDayMonth}
            tick={{ fill: 'var(--muted)', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--rule-strong)' }}
            minTickGap={28}
          />
          <YAxis
            domain={[40, top]}
            ticks={ticks}
            tick={{ fill: 'var(--muted)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--rule-strong)' }} />
          {SLOTS.map((s) => (
            <Line
              key={s.value}
              dataKey={s.value}
              stroke="none"
              dot={{ r: 2.5, fill: 'var(--muted)', fillOpacity: 0.6, stroke: 'none' }}
              activeDot={false}
              isAnimationActive={false}
              legendType="none"
            />
          ))}
          <Line
            dataKey="average"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="chart-key">
        <span>
          <span className="key key-line" /> Daily average
        </span>
        <span>
          <span className="key key-dot" /> Single reading
        </span>
        <span>
          <span className="key key-band" /> 70–180 mg/dl
        </span>
      </p>
    </div>
  )
}
