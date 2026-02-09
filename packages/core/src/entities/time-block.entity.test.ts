import { describe, test, expect, beforeEach, vi } from 'vitest'
import { TimeBlockEntity } from './time-block.entity'

describe('TimeBlockEntity', () => {
  const mockIdGenerator = vi.fn(() => 'test-id-123')

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create method', () => {
    test('creates TimeBlockEntity instance with correct initial values', () => {
      const startTime = new Date('2024-01-01T10:00:00')
      const endTime = new Date('2024-01-01T12:00:00')

      const timeBlock = TimeBlockEntity.create(mockIdGenerator, {
        taskId: 'task-1',
        startTime,
        endTime,
      })

      expect(timeBlock.taskId).toBe('task-1')
      expect(timeBlock.startTime).toEqual(startTime)
      expect(timeBlock.endTime).toEqual(endTime)
      expect(timeBlock.rescheduledTimes).toBe(0)
      expect(mockIdGenerator).toHaveBeenCalledTimes(1)
    })

    test('should throw when endTime is earlier than startTime', () => {
      const startTime = new Date('2024-01-01T12:00:00')
      const endTime = new Date('2024-01-01T10:00:00')

      expect(() => {
        TimeBlockEntity.create(mockIdGenerator, {
          taskId: 'task-1',
          startTime,
          endTime,
        })
      }).toThrow('Start time must be before end time')
    })

    test('should throw when time block is less than 15 minutes', () => {
      const startTime = new Date('2024-01-01T10:00:00')
      const endTime = new Date('2024-01-01T10:14:59')

      expect(() => {
        TimeBlockEntity.create(mockIdGenerator, {
          taskId: 'task-1',
          startTime,
          endTime,
        })
      }).toThrow('Time block must be at least 15 minutes')
    })

    test('should throw when time block is more than 16 hours', () => {
      const startTime = new Date('2024-01-01T00:00:00')
      const endTime = new Date('2024-01-01T16:01:00')

      expect(() => {
        TimeBlockEntity.create(mockIdGenerator, {
          taskId: 'task-1',
          startTime,
          endTime,
        })
      }).toThrow('Time block cannot exceed 16 hours')
    })
  })

  describe('restore method', () => {
    test('restores entity from persisted data', () => {
      const persistedData = {
        id: 'restored-id',
        taskId: 'task-2',
        startTime: new Date('2024-01-01T10:00:00').getTime(),
        endTime: new Date('2024-01-01T12:00:00').getTime(),
        createdAt: new Date('2024-01-01T09:00:00').getTime(),
        rescheduledTimes: 3,
      }

      const timeBlock = TimeBlockEntity.restore(persistedData)

      expect(timeBlock.taskId).toBe('task-2')
      expect(timeBlock.startTime.getTime()).toBe(persistedData.startTime)
      expect(timeBlock.endTime.getTime()).toBe(persistedData.endTime)
      expect(timeBlock.rescheduledTimes).toBe(3)
    })
  })

  describe('toData method', () => {
    test('converts entity to DTO correctly', () => {
      const startTime = new Date('2024-01-01T10:00:00')
      const endTime = new Date('2024-01-01T12:00:00')

      const timeBlock = TimeBlockEntity.create(mockIdGenerator, {
        taskId: 'task-1',
        startTime,
        endTime,
      })

      const data = timeBlock.toData()

      expect(data).toEqual({
        id: 'test-id-123',
        taskId: 'task-1',
        startTime: startTime.getTime(),
        endTime: endTime.getTime(),
        createdAt: expect.any(Number),
        rescheduledTimes: 0,
      })

      // Проверяем, что даты конвертируются корректно
      expect(new Date(data.startTime)).toEqual(startTime)
      expect(new Date(data.endTime)).toEqual(endTime)
    })
  })

  describe('duration calculations', () => {
    test('returns correct duration in minutes', () => {
      const timeBlock = TimeBlockEntity.create(mockIdGenerator, {
        taskId: 'task-1',
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: new Date('2024-01-01T11:30:00'),
      })

      expect(timeBlock.durationInMinutes).toBe(90)
    })

    test('returns correct duration in hours', () => {
      const timeBlock = TimeBlockEntity.create(mockIdGenerator, {
        taskId: 'task-1',
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: new Date('2024-01-01T13:30:00'),
      })

      expect(timeBlock.durationInHours).toBe(3.5)
    })

    test('handles edge cases with milliseconds', () => {
      const timeBlock = TimeBlockEntity.create(mockIdGenerator, {
        taskId: 'task-1',
        startTime: new Date('2024-01-01T10:00:00.000'),
        endTime: new Date('2024-01-01T10:15:00.999'),
      })

      expect(timeBlock.durationInMinutes).toBe(15)
    })
  })

  describe('reschedule method', () => {
    test('successfully reschedules time block', () => {
      const timeBlock = TimeBlockEntity.create(mockIdGenerator, {
        taskId: 'task-1',
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: new Date('2024-01-01T12:00:00'),
      })

      const newStartTime = new Date('2024-01-01T14:00:00')
      const newEndTime = new Date('2024-01-01T16:00:00')

      timeBlock.reschedule(newStartTime, newEndTime)

      expect(timeBlock.startTime).toEqual(newStartTime)
      expect(timeBlock.endTime).toEqual(newEndTime)
      expect(timeBlock.rescheduledTimes).toBe(1)
    })

    test('increments rescheduledTimes counter', () => {
      const timeBlock = TimeBlockEntity.create(mockIdGenerator, {
        taskId: 'task-1',
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: new Date('2024-01-01T12:00:00'),
      })

      timeBlock.reschedule(new Date('2024-01-01T14:00:00'), new Date('2024-01-01T16:00:00'))
      expect(timeBlock.rescheduledTimes).toBe(1)

      timeBlock.reschedule(new Date('2024-01-02T10:00:00'), new Date('2024-01-02T12:00:00'))
      expect(timeBlock.rescheduledTimes).toBe(2)
    })

    test('throws and rolls back on invalid reschedule', () => {
      const originalStartTime = new Date('2024-01-01T10:00:00')
      const originalEndTime = new Date('2024-01-01T12:00:00')

      const timeBlock = TimeBlockEntity.create(mockIdGenerator, {
        taskId: 'task-1',
        startTime: originalStartTime,
        endTime: originalEndTime,
      })

      expect(() => {
        timeBlock.reschedule(new Date('2024-01-01T14:00:00'), new Date('2024-01-01T13:00:00'))
      }).toThrow('Start time must be before end time')

      expect(timeBlock.startTime).toEqual(originalStartTime)
      expect(timeBlock.endTime).toEqual(originalEndTime)
      expect(timeBlock.rescheduledTimes).toBe(0)
    })
  })

  describe('contains method', () => {
    test('returns true when time block contains another', () => {
      const timeBlock = TimeBlockEntity.create(mockIdGenerator, {
        taskId: 'task-1',
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: new Date('2024-01-01T14:00:00'),
      })

      const containedBlock = {
        startTime: new Date('2024-01-01T11:00:00'),
        endTime: new Date('2024-01-01T13:00:00'),
      }

      expect(timeBlock.contains(containedBlock)).toBe(true)
    })

    test('returns false when time block does not contain another', () => {
      const timeBlock = TimeBlockEntity.create(mockIdGenerator, {
        taskId: 'task-1',
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: new Date('2024-01-01T12:00:00'),
      })

      const outsideBlock = {
        startTime: new Date('2024-01-01T13:00:00'),
        endTime: new Date('2024-01-01T15:00:00'),
      }

      expect(timeBlock.contains(outsideBlock)).toBe(false)
    })

    test('returns true when blocks have equal boundaries', () => {
      const timeBlock = TimeBlockEntity.create(mockIdGenerator, {
        taskId: 'task-1',
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: new Date('2024-01-01T12:00:00'),
      })

      const sameBlock = {
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: new Date('2024-01-01T12:00:00'),
      }

      expect(timeBlock.contains(sameBlock)).toBe(true)
    })
  })

  describe('overlaps method', () => {
    test('returns true when time blocks overlap', () => {
      const timeBlock = TimeBlockEntity.create(mockIdGenerator, {
        taskId: 'task-1',
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: new Date('2024-01-01T14:00:00'),
      })

      const overlappingBlock = {
        startTime: new Date('2024-01-01T13:00:00'),
        endTime: new Date('2024-01-01T15:00:00'),
      }

      expect(timeBlock.overlaps(overlappingBlock)).toBe(true)
    })

    test('returns false when time blocks do not overlap', () => {
      const timeBlock = TimeBlockEntity.create(mockIdGenerator, {
        taskId: 'task-1',
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: new Date('2024-01-01T12:00:00'),
      })

      const nonOverlappingBlock = {
        startTime: new Date('2024-01-01T12:00:00'),
        endTime: new Date('2024-01-01T14:00:00'),
      }

      expect(timeBlock.overlaps(nonOverlappingBlock)).toBe(false)
    })

    test('returns true when one block contains another', () => {
      const timeBlock = TimeBlockEntity.create(mockIdGenerator, {
        taskId: 'task-1',
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: new Date('2024-01-01T14:00:00'),
      })

      const containedBlock = {
        startTime: new Date('2024-01-01T11:00:00'),
        endTime: new Date('2024-01-01T13:00:00'),
      }

      expect(timeBlock.overlaps(containedBlock)).toBe(true)
    })
  })

  describe('edge cases', () => {
    test('handles exact 15-minute duration', () => {
      expect(() => {
        TimeBlockEntity.create(mockIdGenerator, {
          taskId: 'task-1',
          startTime: new Date('2024-01-01T10:00:00'),
          endTime: new Date('2024-01-01T10:15:00'),
        })
      }).not.toThrow()
    })

    test('handles exact 16-hour duration', () => {
      expect(() => {
        TimeBlockEntity.create(mockIdGenerator, {
          taskId: 'task-1',
          startTime: new Date('2024-01-01T00:00:00'),
          endTime: new Date('2024-01-01T16:00:00'),
        })
      }).not.toThrow()
    })

    test('getters return new Date instances (immutability)', () => {
      const timeBlock = TimeBlockEntity.create(mockIdGenerator, {
        taskId: 'task-1',
        startTime: new Date('2024-01-01T10:00:00'),
        endTime: new Date('2024-01-01T12:00:00'),
      })

      const startTime = timeBlock.startTime
      startTime.setHours(14)

      expect(timeBlock.startTime.getHours()).toBe(10)
    })
  })
})
