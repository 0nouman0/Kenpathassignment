/**
 * American Diabetes Association (ADA) Clinical Reference Guidelines
 * Fasting target: 70 - 130 mg/dL (Normal non-diabetic < 100 mg/dL)
 * Post-prandial (after meal) target: < 180 mg/dL (Normal non-diabetic < 140 mg/dL)
 * Hypoglycemia (Low): < 70 mg/dL
 * Severe Hyperglycemia (High): > 250 mg/dL
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

/**
 * Categorize a glucose value into clinical status
 */
export function getGlucoseStatus(value, slot = 'morning_fasting') {
  const val = Number(value)
  if (isNaN(val) || val <= 0) {
    return {
      status: 'unknown',
      label: 'Unknown',
      tone: 'neutral',
      className: 'status-neutral',
      description: 'Pending value',
    }
  }

  // Hypoglycemia check (< 70 mg/dL)
  if (val < 70) {
    return {
      status: 'low',
      label: 'Low (Hypo)',
      tone: 'info',
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
      tone: 'success',
      className: 'status-target',
      description: isFasting ? '70–130 mg/dL fasting target' : '< 180 mg/dL post-meal target',
    }
  }

  if (val <= (isFasting ? 180 : 240)) {
    return {
      status: 'elevated',
      label: 'Elevated',
      tone: 'warning',
      className: 'status-elevated',
      description: 'Above target range',
    }
  }

  return {
    status: 'high',
    label: 'High (Hyper)',
    tone: 'danger',
    className: 'status-high',
    description: 'Significantly elevated glucose',
  }
}

/**
 * Format date string (YYYY-MM-DD) to friendly clinical presentation
 */
export function formatDisplayDate(dateStr) {
  if (!dateStr) return ''
  // Handle ISO string or YYYY-MM-DD
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

/**
 * Format full date with day of week
 */
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
