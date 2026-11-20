import { describe, it, expect } from 'vitest'
import {
  convertMgdlToMmol,
  convertMmolToMgdl,
  calculateTimeInRange,
  calculateEstimatedHbA1c,
  formatGlucose,
  CLINICAL_THRESHOLDS,
  PRESET_TAGS,
} from '../config/clinical'

describe('Clinical Configuration & Calculation Tests', () => {
  describe('Unit Conversions (mg/dL <-> mmol/L)', () => {
    it('converts mg/dL to mmol/L correctly with 1 decimal precision', () => {
      // 180 mg/dL / 18.016 = 9.991 -> 10.0 mmol/L
      expect(convertMgdlToMmol(180)).toBe(10.0)
      // 100 mg/dL / 18.016 = 5.55 -> 5.6 mmol/L
      expect(convertMgdlToMmol(100)).toBe(5.6)
      // 70 mg/dL / 18.016 = 3.88 -> 3.9 mmol/L
      expect(convertMgdlToMmol(70)).toBe(3.9)
    })

    it('converts mmol/L to mg/dL correctly as whole integer', () => {
      expect(convertMmolToMgdl(5.6)).toBe(101)
      expect(convertMmolToMgdl(10.0)).toBe(180)
    })

    it('formats glucose with correct unit suffix', () => {
      expect(formatGlucose(120, 'mgdl')).toBe('120 mg/dL')
      expect(formatGlucose(120, 'mmol')).toBe('6.7 mmol/L')
      expect(formatGlucose(null)).toBe('–')
    })
  })

  describe('Time-in-Range (TIR) Formula', () => {
    it('calculates 100% when all readings are between 70 and 180 mg/dL', () => {
      const readings = [{ value_mgdl: 80 }, { value_mgdl: 120 }, { value_mgdl: 175 }]
      expect(calculateTimeInRange(readings)).toBe(100.0)
    })

    it('calculates partial TIR correctly', () => {
      // 2 in range (100, 150), 2 out of range (55 hypo, 220 hyper) -> 50.0%
      const readings = [
        { value_mgdl: 55 },
        { value_mgdl: 100 },
        { value_mgdl: 150 },
        { value_mgdl: 220 },
      ]
      expect(calculateTimeInRange(readings)).toBe(50.0)
    })

    it('returns 0 for empty readings list', () => {
      expect(calculateTimeInRange([])).toBe(0)
    })
  })

  describe('Estimated HbA1c (ADAG Formula)', () => {
    it('calculates estimated HbA1c correctly: (eAG + 46.7) / 28.7', () => {
      // Average 154 mg/dL -> (154 + 46.7) / 28.7 = 200.7 / 28.7 = 6.99 -> 7.0%
      expect(calculateEstimatedHbA1c(154)).toBe(7.0)
      // Average 126 mg/dL -> (126 + 46.7) / 28.7 = 172.7 / 28.7 = 6.01 -> 6.0%
      expect(calculateEstimatedHbA1c(126)).toBe(6.0)
      // Average 97 mg/dL -> (97 + 46.7) / 28.7 = 143.7 / 28.7 = 5.0%
      expect(calculateEstimatedHbA1c(97)).toBe(5.0)
    })

    it('returns null for empty or invalid averages', () => {
      expect(calculateEstimatedHbA1c(null)).toBeNull()
      expect(calculateEstimatedHbA1c(0)).toBeNull()
    })
  })

  describe('Preset Tags and Thresholds', () => {
    it('defines the 4 medical context preset tags', () => {
      const tagIds = PRESET_TAGS.map((t) => t.id)
      expect(tagIds).toContain('after_exercise')
      expect(tagIds).toContain('missed_insulin')
      expect(tagIds).toContain('stress')
      expect(tagIds).toContain('illness')
    })

    it('defines ADA standard thresholds', () => {
      expect(CLINICAL_THRESHOLDS.HYPO_THRESHOLD).toBe(70)
      expect(CLINICAL_THRESHOLDS.FASTING_TARGET_MAX).toBe(130)
      expect(CLINICAL_THRESHOLDS.POST_PRANDIAL_MAX).toBe(180)
    })
  })
})
