import { describe, test, expect } from 'vitest'
import { IntervalVO, type IntervalDTO } from './interval.vo'

describe('IntervalVO', () => {
  describe('constructor', () => {
    test('should create an interval with type and startTime', () => {
      const start = new Date('2023-01-01T10:00:00Z')
      const interval = new IntervalVO('work', start)

      expect(interval.type).toBe('work')
      expect(interval.startTime).toBe(start)
      expect(interval.endTime).toBeUndefined()
    })

    test('should create an interval with endTime when provided', () => {
      const start = new Date('2023-01-01T10:00:00Z')
      const end = new Date('2023-01-01T11:00:00Z')
      const interval = new IntervalVO('break', start, end)

      expect(interval.type).toBe('break')
      expect(interval.startTime).toBe(start)
      expect(interval.endTime).toBe(end)
    })

    test('should throw if endTime is not after startTime', () => {
      const start = new Date('2023-01-01T10:00:00Z')
      const endBefore = new Date('2023-01-01T09:00:00Z')
      const endEqual = new Date('2023-01-01T10:00:00Z')

      expect(() => new IntervalVO('work', start, endBefore)).toThrow(
        'End time must be after start time'
      )
      expect(() => new IntervalVO('work', start, endEqual)).toThrow(
        'End time must be after start time'
      )
    })
  })

  describe('restore', () => {
    test('should create an IntervalVO from a DTO', () => {
      const dto: IntervalDTO = {
        sessionId: 'sess-1',
        type: 'work',
        startTime: 1672574400000,
        endTime: 1672578000000,
      }
      const interval = IntervalVO.restore(dto)

      expect(interval.type).toBe('work')
      expect(interval.startTime).toEqual(new Date(dto.startTime))
      expect(interval.endTime).toEqual(new Date(dto.endTime!))
    })

    test('should handle missing endTime', () => {
      const dto: IntervalDTO = {
        sessionId: 'sess-1',
        type: 'break',
        startTime: 1672574400000,
        endTime: null,
      }
      const interval = IntervalVO.restore(dto)

      expect(interval.endTime).toBeUndefined()
    })
  })

  describe('toData', () => {
    test('should convert to DTO with sessionId', () => {
      const start = new Date('2023-01-01T10:00:00Z')
      const end = new Date('2023-01-01T11:00:00Z')
      const interval = new IntervalVO('work', start, end)
      const sessionId = 'sess-1'

      const dto = interval.toData(sessionId)

      expect(dto).toEqual({
        sessionId,
        type: 'work',
        startTime: start.getTime(),
        endTime: end.getTime(),
      })
    })

    test('should set endTime to null when undefined', () => {
      const start = new Date('2023-01-01T10:00:00Z')
      const interval = new IntervalVO('work', start)
      const sessionId = 'sess-1'

      const dto = interval.toData(sessionId)

      expect(dto.endTime).toBeNull()
    })
  })

  describe('isActive', () => {
    test('should return true if endTime is undefined', () => {
      const interval = new IntervalVO('work', new Date())
      expect(interval.isActive()).toBe(true)
    })

    test('should return false if endTime is defined', () => {
      const startTime = new Date()
      const endTime = new Date(new Date().getTime() + 1)
      const interval = new IntervalVO('work', startTime, endTime)
      expect(interval.isActive()).toBe(false)
    })
  })

  describe('equals', () => {
    test('should return true for identical intervals', () => {
      const start = new Date('2023-01-01T10:00:00Z')
      const end = new Date('2023-01-01T11:00:00Z')
      const interval1 = new IntervalVO('work', start, end)
      const interval2 = new IntervalVO('work', start, end)

      expect(interval1.equals(interval2)).toBe(true)
    })

    test('should return false for different types', () => {
      const start = new Date('2023-01-01T10:00:00Z')
      const interval1 = new IntervalVO('work', start)
      const interval2 = new IntervalVO('break', start)

      expect(interval1.equals(interval2)).toBe(false)
    })

    test('should return false for different start times', () => {
      const start1 = new Date('2023-01-01T10:00:00Z')
      const start2 = new Date('2023-01-01T11:00:00Z')
      const interval1 = new IntervalVO('work', start1)
      const interval2 = new IntervalVO('work', start2)

      expect(interval1.equals(interval2)).toBe(false)
    })

    test('should return false for different end times (one undefined, one defined)', () => {
      const start = new Date('2023-01-01T10:00:00Z')
      const interval1 = new IntervalVO('work', start)
      const interval2 = new IntervalVO('work', start, new Date('2023-01-01T11:00:00Z'))

      expect(interval1.equals(interval2)).toBe(false)
    })

    test('should return false for different end times (both defined)', () => {
      const start = new Date('2023-01-01T10:00:00Z')
      const end1 = new Date('2023-01-01T11:00:00Z')
      const end2 = new Date('2023-01-01T11:01:00Z')
      const interval1 = new IntervalVO('work', start, end1)
      const interval2 = new IntervalVO('work', start, end2)

      expect(interval1.equals(interval2)).toBe(false)
    })
  })
})
