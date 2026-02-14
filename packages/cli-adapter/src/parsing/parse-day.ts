import { parseDayOfWeek } from './parse-day-of-week.js'
import { parseDayOfMonth } from './parse-day-of-month.js'
import { parseRelativeDay } from './parse-relative-day.js'
import { parseExplicitDate } from './parse-explicit-date.js'

/**
 * Determines the type of user input (weekday or day of month, for example)
 * and returns the corresponding date (start of day).
 *
 * @param input - User input string (e.g., "вторник", "15", "пн", "31")
 * @param locale - Locale identifier (default 'ru')
 * @returns Date (start of day) or null if input is not recognized
 */
export function parseDay(input: string, locale: string = 'ru'): Date | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const relative = parseRelativeDay(trimmed)
  if (relative) return relative

  const weekday = parseDayOfWeek(trimmed)
  if (weekday) return weekday

  const dayOfMonth = parseDayOfMonth(trimmed)
  if (dayOfMonth) return dayOfMonth

  const explicit = parseExplicitDate(trimmed, locale)
  if (explicit) return explicit

  return null
}
