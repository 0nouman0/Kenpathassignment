import React from 'react'

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="table-wrapper" aria-busy="true" aria-label="Loading readings table">
      <div style={{ padding: '16px' }}>
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              padding: '12px 0',
              borderBottom: '1px solid var(--slate-100)',
            }}
          >
            <div style={{ width: '15%', height: '18px', background: 'var(--slate-200)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
            <div style={{ width: '25%', height: '18px', background: 'var(--slate-200)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
            <div style={{ width: '15%', height: '18px', background: 'var(--slate-200)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
            <div style={{ width: '20%', height: '18px', background: 'var(--slate-200)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
            <div style={{ width: '10%', height: '18px', background: 'var(--slate-200)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ReportCardsSkeleton() {
  return (
    <div className="report-cards-row" aria-busy="true" aria-label="Loading reports">
      {[1, 2, 3].map((i) => (
        <div key={i} className="report-card" style={{ padding: '24px' }}>
          <div style={{ width: '50%', height: '20px', background: 'var(--slate-200)', borderRadius: '4px', marginBottom: '8px', animation: 'pulse 1.5s infinite' }} />
          <div style={{ width: '30%', height: '14px', background: 'var(--slate-100)', borderRadius: '4px', marginBottom: '20px', animation: 'pulse 1.5s infinite' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {[1, 2, 3, 4].map((j) => (
              <div key={j} style={{ height: '60px', background: 'var(--slate-100)', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="report-card" style={{ padding: '24px', marginTop: '20px' }} aria-busy="true" aria-label="Loading chart">
      <div style={{ width: '40%', height: '20px', background: 'var(--slate-200)', borderRadius: '4px', marginBottom: '16px', animation: 'pulse 1.5s infinite' }} />
      <div style={{ width: '100%', height: '240px', background: 'var(--slate-100)', borderRadius: '8px', animation: 'pulse 1.5s infinite' }} />
    </div>
  )
}
