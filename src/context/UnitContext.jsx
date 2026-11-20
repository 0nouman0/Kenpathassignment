'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { formatGlucose } from '@/config/clinical'

const UnitContext = createContext({
  unit: 'mgdl',
  setUnit: () => {},
  toggleUnit: () => {},
  format: (val) => String(val),
  unitLabel: 'mg/dL',
})

export function UnitProvider({ children }) {
  const [unit, setUnitState] = useState('mgdl')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sweety_glucose_unit')
      if (saved === 'mmol' || saved === 'mgdl') {
        setUnitState(saved)
      }
    }
  }, [])

  const setUnit = (newUnit) => {
    if (newUnit === 'mmol' || newUnit === 'mgdl') {
      setUnitState(newUnit)
      if (typeof window !== 'undefined') {
        localStorage.setItem('sweety_glucose_unit', newUnit)
      }
    }
  }

  const toggleUnit = () => {
    const next = unit === 'mgdl' ? 'mmol' : 'mgdl'
    setUnit(next)
  }

  const format = (valueMgdl) => formatGlucose(valueMgdl, unit)

  return (
    <UnitContext.Provider
      value={{
        unit,
        setUnit,
        toggleUnit,
        format,
        unitLabel: unit === 'mmol' ? 'mmol/L' : 'mg/dL',
      }}
    >
      {children}
    </UnitContext.Provider>
  )
}

export function useGlucoseUnit() {
  return useContext(UnitContext)
}
