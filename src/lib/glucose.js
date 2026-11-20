/**
 * American Diabetes Association (ADA) Clinical Reference Guidelines
 */

export const SLOT_CONFIG = {
  morning_fasting: {
    label: 'Morning (fasting)',
    shortLabel: 'Fasting',
    timing: 'Upon waking, before breakfast',
    targetMin: 70,
    targetMax: 130,
    optimalMax: 99,
  },
  after_breakfast: {
    label: 'After breakfast',
    shortLabel: 'Post-Breakfast',
    timing: '1–2 hours after breakfast',
    targetMin: 70,
    targetMax: 180,
    optimalMax: 140,
  },
  after_lunch: {
    label: 'After lunch',
    shortLabel: 'Post-Lunch',
    timing: '1–2 hours after lunch',
    targetMin: 70,
    targetMax: 180,
    optimalMax: 140,
  },
  after_dinner: {
    label: 'After dinner',
    shortLabel: 'Post-Dinner',
    timing: '1–2 hours after dinner',
    targetMin: 70,
    targetMax: 180,
    optimalMax: 140,
  },
}

export const SLOTS_ORDER = [
  'morning_fasting',
  'after_breakfast',
  'after_lunch',
  'after_dinner',
]

export function getGlucoseStatus(value, slot = 'morning_fasting') {
  const val = Number(value)
  if (isNaN(val) || val <= 0) {
    return {
      status: 'unknown',
      label: 'Unknown',
      className: 'status-neutral',
      description: 'Pending value',
    }
  }

  // Hypoglycemia (< 70 mg/dL)
  if (val < 70) {
    return {
      status: 'low',
      label: 'Low (Hypo)',
      className: 'status-low',
      description: 'Below 70 mg/dL · Action may be required',
    }
  }

  const isFasting = slot === 'morning_fasting'
  const targetThreshold = isFasting ? 130 : 180

  if (val <= targetThreshold) {
    return {
      status: 'target',
      label: 'In Target',
      className: 'status-target',
      description: isFasting ? '70–130 mg/dL fasting target' : '< 180 mg/dL post-meal target',
    }
  }

  if (val <= (isFasting ? 180 : 240)) {
    return {
      status: 'elevated',
      label: 'Elevated',
      className: 'status-elevated',
      description: 'Above target range',
    }
  }

  return {
    status: 'high',
    label: 'High (Hyper)',
    className: 'status-high',
    description: 'Significantly elevated glucose',
  }
}

export function formatDisplayDate(dateStr) {
  if (!dateStr) return ''
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
  const [year, month, day] = clean.split('-').map(Number)
  if (!year || !month || !day) return dateStr

  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatFullDate(dateStr) {
  if (!dateStr) return ''
  const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
  const [year, month, day] = clean.split('-').map(Number)
  if (!year || !month || !day) return dateStr

  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
