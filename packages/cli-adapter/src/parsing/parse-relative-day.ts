import { addDays, startOfDay } from 'date-fns'

const relativeDayMap: Record<string, number> = {
  // Russian
  сегодня: 0,
  завтра: 1,
  послезавтра: 2,
  // English
  today: 0,
  tomorrow: 1,
  'after tomorrow': 2,
}

export function parseRelativeDay(input: string): Date | null {
  const trimmed = input.trim().toLowerCase()
  if (!trimmed) return null

  const offset = relativeDayMap[trimmed]
  if (offset === undefined) return null

  return startOfDay(addDays(new Date(), offset))
}
