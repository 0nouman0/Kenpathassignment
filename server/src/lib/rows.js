export const READING_COLUMNS = 'id, reading_date, time_slot, value_mgdl'

export const SLOT_ORDER_SQL = `CASE time_slot
  WHEN 'morning' THEN 1 WHEN 'after_breakfast' THEN 2
  WHEN 'after_lunch' THEN 3 ELSE 4 END`

/** Shapes a database row for the API. reading_date is always a plain YYYY-MM-DD string. */
export function toReading(row) {
  const date = row.reading_date
  return {
    id: row.id,
    reading_date: typeof date === 'string' ? date.slice(0, 10) : date.toISOString().slice(0, 10),
    time_slot: row.time_slot,
    value_mgdl: row.value_mgdl,
  }
}
