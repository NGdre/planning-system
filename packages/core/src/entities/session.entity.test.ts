import { describe, it as test, expect, vi, beforeEach, afterEach } from 'vitest'
import { SessionEntity, type SessionDTO } from './session.entity'

const mockIdGenerator = vi.fn(() => 'sess-123')

describe('SessionEntity', () => {
  const FIXED_NOW = new Date('2024-01-01T10:00:00Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
    mockIdGenerator.mockReturnValue('sess-123')
  })

  afterEach(() => {
    vi.useRealTimers()
    mockIdGenerator.mockClear()
  })

  describe('constructor validation (via create)', () => {
    test('should throw when timeBlockId is provided without taskId', () => {
      expect(() =>
        SessionEntity.create(mockIdGenerator, { taskId: null, timeBlockId: 'block-1' })
      ).toThrow('Planned session must have a taskId')
    })

    test('should NOT throw when both timeBlockId and taskId are provided', () => {
      expect(() =>
        SessionEntity.create(mockIdGenerator, { taskId: 'task-1', timeBlockId: 'block-1' })
      ).not.toThrow()
    })

    test('should NOT throw when both are null (ad-hoc session)', () => {
      expect(() =>
        SessionEntity.create(mockIdGenerator, { taskId: null, timeBlockId: null })
      ).not.toThrow()
    })

    test('should NOT throw when only taskId is provided', () => {
      expect(() =>
        SessionEntity.create(mockIdGenerator, { taskId: 'task-1', timeBlockId: null })
      ).not.toThrow()
    })
  })

  describe('create', () => {
    test('should create a new active session with one work interval', () => {
      const session = SessionEntity.create(mockIdGenerator, { taskId: 'task-1', timeBlockId: null })

      expect(mockIdGenerator).toHaveBeenCalledOnce()
      expect(session.id).toBe('sess-123')
      expect(session.taskId).toBe('task-1')
      expect(session.timeBlockId).toBeNull()
      expect(session.startTime).toEqual(FIXED_NOW)
      expect(session.status).toBe('active')
      expect(session.intervals).toHaveLength(1)

      const interval = session.intervals[0]
      expect(interval.type).toBe('work')
      expect(interval.startTime).toEqual(FIXED_NOW)
      expect(interval.endTime).toBeUndefined()
    })
  })

  describe('restore', () => {
    test('should restore a session from DTO with endTime', () => {
      const sessionStartTime = new Date('2024-01-01T10:00:00Z')
      const sessionEndTime = new Date(sessionStartTime.getTime() + 10000)

      const dto: SessionDTO = {
        id: 'sess-456',
        taskId: 'task-1',
        timeBlockId: 'block-1',
        startTime: sessionStartTime.getTime(),
        endTime: sessionEndTime.getTime(),
        status: 'completed',
        intervals: [
          {
            sessionId: 'sess-456',
            type: 'work',
            startTime: sessionStartTime.getTime(),
            endTime: sessionEndTime.getTime(),
          },
        ],
      }

      const session = SessionEntity.restore(dto)

      expect(session.id).toBe('sess-456')
      expect(session.taskId).toBe('task-1')
      expect(session.timeBlockId).toBe('block-1')
      expect(session.startTime).toEqual(new Date(sessionStartTime))
      expect(session.status).toBe('completed')
      expect(session.intervals).toHaveLength(1)
      expect(session.intervals[0].type).toBe('work')
      expect(session.intervals[0].startTime).toEqual(new Date(sessionStartTime))
      expect(session.intervals[0].endTime).toEqual(sessionEndTime)
    })

    test('should restore a session from DTO with null endTime', () => {
      const dto: SessionDTO = {
        id: 'sess-456',
        taskId: null,
        timeBlockId: null,
        startTime: 1704117600000,
        endTime: null,
        status: 'active',
        intervals: [
          {
            sessionId: 'sess-456',
            type: 'work',
            startTime: 1704117600000,
            endTime: null,
          },
        ],
      }

      const session = SessionEntity.restore(dto)

      expect(session.status).toBe('active')
      expect(session.intervals[0].endTime).toBeUndefined()
    })
  })

  describe('toData', () => {
    test('should convert an active session to DTO', () => {
      const session = SessionEntity.create(mockIdGenerator, { taskId: 'task-1', timeBlockId: null })
      const dto = session.toData()

      expect(dto).toEqual({
        id: 'sess-123',
        taskId: 'task-1',
        timeBlockId: null,
        startTime: FIXED_NOW.getTime(),
        endTime: null,
        status: 'active',
        intervals: [
          {
            sessionId: 'sess-123',
            type: 'work',
            startTime: FIXED_NOW.getTime(),
            endTime: null,
          },
        ],
      })
    })

    test('should convert a completed session to DTO', () => {
      const endTime = new Date(FIXED_NOW.getTime() + 3600000) // +1h
      vi.setSystemTime(endTime)

      const session = SessionEntity.create(mockIdGenerator, { taskId: null, timeBlockId: null })
      session.stop()

      const dto = session.toData()

      expect(dto.endTime).toBe(endTime.getTime())
      expect(dto.status).toBe('completed')
      expect(dto.intervals[0].endTime).toBe(endTime.getTime())
    })
  })

  describe('pause', () => {
    test('should pause a work interval and start a break interval', () => {
      const session = SessionEntity.create(mockIdGenerator, { taskId: null, timeBlockId: null })

      // Advance time by 25 minutes
      const pauseTime = new Date(FIXED_NOW.getTime() + 25 * 60 * 1000)
      vi.setSystemTime(pauseTime)

      session.pause()

      expect(session.intervals).toHaveLength(2)
      const workInterval = session.intervals[0]
      const breakInterval = session.intervals[1]

      expect(workInterval.type).toBe('work')
      expect(workInterval.endTime).toEqual(pauseTime)

      expect(breakInterval.type).toBe('break')
      expect(breakInterval.startTime).toEqual(pauseTime)
      expect(breakInterval.endTime).toBeUndefined()

      expect(session.status).toBe('active')
    })

    test('should throw if session is not active', () => {
      const session = SessionEntity.create(mockIdGenerator, { taskId: null, timeBlockId: null })
      session.stop()

      expect(() => session.pause()).toThrow('Session is already completed')
    })

    test('should throw if current interval is not work (e.g., break)', () => {
      const session = SessionEntity.create(mockIdGenerator, { taskId: null, timeBlockId: null })

      vi.setSystemTime(FIXED_NOW.getTime() + 25 * 60 * 1000)
      session.pause()

      expect(() => session.pause()).toThrow('Cannot pause: not in work')
    })
  })

  describe('resume', () => {
    test('should resume a break interval and start a work interval', () => {
      const session = SessionEntity.create(mockIdGenerator, { taskId: null, timeBlockId: null })

      const pauseTime = new Date(FIXED_NOW.getTime() + 25 * 60 * 1000)
      vi.setSystemTime(pauseTime)
      session.pause()

      // Advance time by 5 minutes (break duration)
      const resumeTime = new Date(pauseTime.getTime() + 5 * 60 * 1000)
      vi.setSystemTime(resumeTime)

      session.resume()

      expect(session.intervals).toHaveLength(3)
      const breakInterval = session.intervals[1]
      const newWorkInterval = session.intervals[2]

      expect(breakInterval.type).toBe('break')
      expect(breakInterval.endTime).toEqual(resumeTime)

      expect(newWorkInterval.type).toBe('work')
      expect(newWorkInterval.startTime).toEqual(resumeTime)
      expect(newWorkInterval.endTime).toBeUndefined()

      expect(session.status).toBe('active')
    })

    test('should throw if session is not active', () => {
      const session = SessionEntity.create(mockIdGenerator, { taskId: null, timeBlockId: null })
      session.stop()

      expect(() => session.resume()).toThrow('Session is already completed')
    })

    test('should throw if current interval is not break', () => {
      const session = SessionEntity.create(mockIdGenerator, { taskId: null, timeBlockId: null })
      // Current interval is work
      expect(() => session.resume()).toThrow('Cannot resume: not in break')
    })
  })

  describe('stop', () => {
    test('should stop an active session and close the current interval', () => {
      const session = SessionEntity.create(mockIdGenerator, { taskId: null, timeBlockId: null })

      const stopTime = new Date(FIXED_NOW.getTime() + 2 * 60 * 60 * 1000)
      vi.setSystemTime(stopTime)

      session.stop()

      expect(session.status).toBe('completed')
      expect(session.intervals[0].endTime).toEqual(stopTime)
    })

    test('should throw if session is already completed', () => {
      const session = SessionEntity.create(mockIdGenerator, { taskId: null, timeBlockId: null })
      session.stop()

      expect(() => session.stop()).toThrow('Session is already completed')
    })
  })

  describe('status getter', () => {
    test('should be active when no endTime', () => {
      const session = SessionEntity.create(mockIdGenerator, { taskId: null, timeBlockId: null })
      expect(session.status).toBe('active')
    })

    test('should be completed after stop', () => {
      const session = SessionEntity.create(mockIdGenerator, { taskId: null, timeBlockId: null })
      session.stop()
      expect(session.status).toBe('completed')
    })
  })
})
