import { addDays, startOfDay } from 'date-fns'

/**
 * Returns the start of the day that is `relativeDay` days away from a reference date.
 *
 * @param relativeDay - Number of days offset:
 *   - r0  → today
 *   - r1  → tomorrow
 *   - r-1 → yesterday
 *   (and so on for any integer)
 * @param referenceDate - The base date (defaults to the current date and time).
 * @returns A Date object set to 00:00:00 of the computed day in the local time zone.
 *
 * @example
 * parseOffsetToDate('r0')               // start of today
 * parseOffsetToDate('r1')               // start of tomorrow
 * parseOffsetToDate('r-3')              // start of three days ago
 * parseOffsetToDate('r5', new Date(2025, 0, 1)) // start of 2025-01-06
 */
export function parseOffsetToDate(
  relativeDayInput: string,
  referenceDate: Date = new Date()
): Date | null {
  if (!relativeDayInput.startsWith('r')) return null

  const relativeDay = +relativeDayInput.slice(1)

  const targetDate = addDays(referenceDate, relativeDay)
  return startOfDay(targetDate)
}
