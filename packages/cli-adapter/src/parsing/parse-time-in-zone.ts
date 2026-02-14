import { fromZonedTime, toZonedTime } from 'date-fns-tz'

/**
 * Parses a time string and returns a function that combines this time with a base date
 * in the specified time zone. The returned date is a Date object in UTC, but with the correct offset.
 *
 * @param input - Time string ("9", "09:00", "9:00")
 * @param timeZone - IANA time zone identifier (e.g., "Europe/Moscow")
 * @returns (baseDate: Date) => Date function, or null
 */
export function parseTimeInZone(
  input: string,
  timeZone: string
): ((baseDate: Date) => Date) | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  let hours: number, minutes: number

  const colonMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/)
  if (colonMatch) {
    hours = parseInt(colonMatch[1], 10)
    minutes = parseInt(colonMatch[2], 10)
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
  } else {
    const hoursMatch = trimmed.match(/^\d{1,2}$/)
    if (hoursMatch) {
      hours = parseInt(hoursMatch[0], 10)
      minutes = 0
      if (hours < 0 || hours > 23) return null
    } else {
      return null
    }
  }

  return (baseDate: Date) => {
    const zonedBase = toZonedTime(baseDate, timeZone)
    zonedBase.setHours(hours, minutes, 0, 0)

    return fromZonedTime(zonedBase, timeZone)
  }
}
