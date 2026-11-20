'use client'

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from 'recharts'
import { ActivityIcon } from './Icons'

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="chart-tooltip-pro">
        <div className="chart-tooltip-date">{label}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
          <div style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Daily Average: {data.avg} mg/dL
          </div>
          {data.min !== undefined && data.max !== undefined && (
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
              Range: {data.min} – {data.max} mg/dL ({data.count} reading{data.count !== 1 ? 's' : ''})
            </div>
          )}
        </div>
      </div>
    )
  }
  return null
}

export default function GlucoseChart({ readings = [] }) {
  if (!readings || readings.length === 0) {
    return (
      <div className="chart-container" style={{ textAlign: 'center', padding: '48px 24px' }}>
        <ActivityIcon size={32} style={{ color: 'var(--slate-300)', margin: '0 auto 12px' }} />
        <h3 className="chart-title" style={{ marginBottom: '4px' }}>Monthly Glucose Trend</h3>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.8125rem' }}>
          No trend readings available for this period. Log multiple readings across the month to view glucose fluctuations.
        </p>
      </div>
    )
  }

  const grouped = {}
  readings.forEach((r) => {
    const rawDate = r.reading_date.includes('T') ? r.reading_date.split('T')[0] : r.reading_date
    if (!grouped[rawDate]) grouped[rawDate] = []
    grouped[rawDate].push(Number(r.value_mgdl))
  })

  const chartData = Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateStr, values]) => {
      const parts = dateStr.split('-')
      const label = parts.length === 3 ? `${parts[1]}/${parts[2]}` : dateStr
      const sum = values.reduce((acc, v) => acc + v, 0)
      return {
        dateKey: dateStr,
        displayDate: label,
        avg: Math.round(sum / values.length),
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      }
    })

  return (
    <div className="chart-container">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">Monthly Glucose Fluctuation Curve</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
            Daily average glucose levels with highlighted ADA Target Zone (70 – 140 mg/dL)
          </p>
        </div>
        <div className="chart-legend-custom">
          <div>
            <span className="legend-indicator" style={{ background: 'var(--primary)' }} />
            <span>Average</span>
          </div>
          <div>
            <span className="legend-indicator" style={{ background: '#e0f2fe' }} />
            <span>Target Zone (70–140)</span>
          </div>
          <div>
            <span className="legend-indicator" style={{ background: 'var(--danger)' }} />
            <span>Peak</span>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 24, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

            <ReferenceArea
              y1={70}
              y2={140}
              fill="#ecfdf5"
              fillOpacity={0.65}
              stroke="#a7f3d0"
              strokeDasharray="2 2"
            />
            <ReferenceLine y={180} stroke="#fecdd3" strokeDasharray="3 3" />
            <ReferenceLine y={70} stroke="#bae6fd" strokeDasharray="3 3" />

            <XAxis
              dataKey="displayDate"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
            />
            <YAxis
              domain={[40, 'auto']}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
              unit=" mg"
            />
            <Tooltip content={<CustomTooltip />} />

            <Line
              type="monotone"
              dataKey="avg"
              stroke="#0d9488"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: '#0d9488', stroke: '#ffffff', strokeWidth: 1.5 }}
              activeDot={{ r: 6, fill: '#0d9488', stroke: '#ffffff', strokeWidth: 2 }}
              name="Average"
            />
            <Line
              type="monotone"
              dataKey="max"
              stroke="#e11d48"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={false}
              name="Peak"
            />
            <Line
              type="monotone"
              dataKey="min"
              stroke="#0284c7"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={false}
              name="Lowest"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
