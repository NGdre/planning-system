import { startOfDay, parse } from 'date-fns'

const localePatterns: Record<string, string[]> = {
  ru: ['dd.MM.yyyy', 'dd.MM.yy'],
  en: ['MM/dd/yyyy', 'MM/dd/yy'],
}

export function parseExplicitDate(input: string, locale: string): Date | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const baseLocale = locale.split('-')[0].toLowerCase()
  const patterns = localePatterns[baseLocale] ? [...localePatterns[baseLocale]] : []

  if (!patterns.includes('yyyy-MM-dd')) {
    patterns.push('yyyy-MM-dd')
  }

  for (const pattern of patterns) {
    try {
      const parsed = parse(trimmed, pattern, new Date())
      if (!isNaN(parsed.getTime())) {
        return startOfDay(parsed)
      }
    } catch {
      return null
    }
  }
  return null
}
