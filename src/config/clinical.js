/**
 * American Diabetes Association (ADA) Clinical Reference Guidelines
 *
 * Citation: American Diabetes Association (ADA) Standards of Care in Diabetes.
 * Disclaimer: Sweety is intended for personal health tracking and informational purposes only.
 * It is not a medical device and does not constitute medical advice or clinical diagnosis.
 */

export const MEDICAL_DISCLAIMER =
  'Sweety is intended for personal health tracking and informational purposes only. It is not a medical device and does not provide medical advice, diagnosis, or clinical treatment recommendations. Consult your endocrinologist or certified healthcare provider.'

export const ADA_CITATION =
  'American Diabetes Association (ADA) Standards of Care in Diabetes'

export const CLINICAL_THRESHOLDS = {
  HYPO_THRESHOLD: 70, // < 70 mg/dL: Hypoglycemia
  FASTING_TARGET_MAX: 130, // 70–130 mg/dL: ADA Fasting Target
  POST_PRANDIAL_MAX: 180, // < 180 mg/dL: ADA Post-Prandial Target
  VERY_HIGH_THRESHOLD: 250, // > 250 mg/dL: Marked Hyperglycemia
  TIR_MIN: 70, // Time in Range Lower Bound
  TIR_MAX: 180, // Time in Range Upper Bound
  MMOL_DIVISOR: 18.016, // Conversion: mg/dL / 18.016 = mmol/L
}

export const PRESET_TAGS = [
  { id: 'after_exercise', label: 'After Exercise' },
  { id: 'missed_insulin', label: 'Missed Insulin' },
  { id: 'stress', label: 'High Stress' },
  { id: 'illness', label: 'Illness / Infection' },
]

/**
 * Converts mg/dL to mmol/L (display only, rounded to 1 decimal)
 */
export function convertMgdlToMmol(mgdl) {
  if (mgdl === null || mgdl === undefined || isNaN(mgdl)) return null
  return parseFloat((Number(mgdl) / CLINICAL_THRESHOLDS.MMOL_DIVISOR).toFixed(1))
}

/**
 * Converts mmol/L to mg/dL (rounded integer)
 */
export function convertMmolToMgdl(mmol) {
  if (mmol === null || mmol === undefined || isNaN(mmol)) return null
  return Math.round(Number(mmol) * CLINICAL_THRESHOLDS.MMOL_DIVISOR)
}

/**
 * Calculates Time-in-Range (TIR) percentage for readings between 70 and 180 mg/dL
 */
export function calculateTimeInRange(readings) {
  if (!readings || readings.length === 0) return 0
  const inRange = readings.filter((r) => {
    const val = Number(r.value_mgdl)
    return val >= CLINICAL_THRESHOLDS.TIR_MIN && val <= CLINICAL_THRESHOLDS.TIR_MAX
  }).length
  return parseFloat(((inRange / readings.length) * 100).toFixed(1))
}

/**
 * Calculates Estimated HbA1c based on ADAG (A1c-Derived Average Glucose) formula:
 * eAG (mg/dL) = 28.7 * HbA1c - 46.7
 * => HbA1c (%) = (eAG + 46.7) / 28.7
 */
export function calculateEstimatedHbA1c(averageMgdl) {
  if (!averageMgdl || isNaN(averageMgdl) || Number(averageMgdl) <= 0) return null
  const a1c = (Number(averageMgdl) + 46.7) / 28.7
  return parseFloat(a1c.toFixed(1))
}

/**
 * Formats glucose reading value with unit
 */
export function formatGlucose(valueMgdl, unit = 'mgdl') {
  if (valueMgdl === null || valueMgdl === undefined) return '–'
  if (unit === 'mmol') {
    return `${convertMgdlToMmol(valueMgdl)} mmol/L`
  }
  return `${valueMgdl} mg/dL`
}
