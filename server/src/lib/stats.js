/** Highest, lowest, average (1 decimal) and count for a list of readings. */
export function summarize(readings) {
  if (readings.length === 0) {
    return { count: 0, highest: null, lowest: null, average: null }
  }
  const values = readings.map((r) => r.value_mgdl)
  const sum = values.reduce((a, b) => a + b, 0)
  return {
    count: values.length,
    highest: Math.max(...values),
    lowest: Math.min(...values),
    average: Math.round((sum / values.length) * 10) / 10,
  }
}
