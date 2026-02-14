import { startOfDay, getISODay, addDays } from 'date-fns'

/**
 * Mapping of weekday names (in Russian and English) to ISO day numbers (1 = Monday, 7 = Sunday).
 * Supports both full and abbreviated variants.
 */
const dayMap: Record<string, number> = {
  // Russian (full)
  понедельник: 1,
  вторник: 2,
  среда: 3,
  четверг: 4,
  пятница: 5,
  суббота: 6,
  воскресенье: 7,
  // Russian (abbreviated)
  пн: 1,
  вт: 2,
  ср: 3,
  чт: 4,
  пт: 5,
  сб: 6,
  вс: 7,
  // English (full)
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7,
  // English (abbreviated)
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sun: 7,
}

/**
 * Converts a string containing a weekday name into a Date object representing the nearest future date
 * corresponding to that day.
 *
 * @param input - User input (e.g., "вторник", "monday", "пн", "tue")
 * @returns Date (with time set to the start of the day) or null if the day is not recognized
 */
export function parseDayOfWeek(input: string): Date | null {
  const trimmed = input.trim().toLowerCase()
  if (!trimmed) return null

  const targetDay = dayMap[trimmed]
  if (targetDay === undefined) return null

  const today = new Date()
  const currentDay = getISODay(today)

  let diff = targetDay - currentDay

  if (diff < 0) {
    diff += 7
  }

  const result = addDays(startOfDay(today), diff)
  return result
}
