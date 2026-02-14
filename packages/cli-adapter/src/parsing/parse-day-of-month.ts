import { startOfDay, getDate, getDaysInMonth } from 'date-fns'

/**
 * Converts a string containing a day of the month into a Date object representing the nearest future date
 * corresponding to that day, according to the rule:
 * - if the day equals the current day → today;
 * - if the day is greater than the current day and exists in the current month → current month;
 * - otherwise (the day is less than the current day or does not exist in the current month) → next month
 *   (provided that such a day exists in the next month).
 *
 * @param input - User input (e.g., "14", "31")
 * @returns Date (start of the day) or null if the day is not recognized or the date does not exist
 */
export function parseDayOfMonth(input: string): Date | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const day = parseInt(trimmed, 10)

  if (isNaN(day) || day < 1 || day > 31) return null

  const now = new Date()
  const currentDay = getDate(now)
  const daysInCurrentMonth = getDaysInMonth(now)

  if (day === currentDay) {
    return startOfDay(now)
  }

  if (day > currentDay && day <= daysInCurrentMonth) {
    const result = new Date(now.getFullYear(), now.getMonth(), day)
    return startOfDay(result)
  }

  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, day)

  if (getDate(nextMonth) === day) {
    return startOfDay(nextMonth)
  }

  return null
}
