import { Knex } from 'knex'
import { beforeEach, describe, expect, test } from 'vitest'
import { SessionDTO, IntervalDTO } from '@planning-system/core'
import { setupTestDb } from '../../utils/test-db-setup'
import { KnexSessionRepository } from './session.repo'
import { KnexTaskRepository } from './task.repo'
import { KnexTimeBlockRepository } from './time-block.repo'

const getTestDb = setupTestDb()

describe('KnexSessionRepository', () => {
  let db: Knex
  let sessionRepository: KnexSessionRepository
  let taskRepository: KnexTaskRepository
  let timeBlockRepository: KnexTimeBlockRepository

  const taskId1 = 'task-1'
  const taskId2 = 'task-2'
  const timeBlockId1 = 'tb-1'
  const timeBlockId2 = 'tb-2'

  beforeEach(async () => {
    db = getTestDb()

    taskRepository = new KnexTaskRepository(db)
    await taskRepository.save({ id: taskId1, title: 'Task 1', status: 'draft' })
    await taskRepository.save({ id: taskId2, title: 'Task 2', status: 'draft' })

    timeBlockRepository = new KnexTimeBlockRepository(db)

    await timeBlockRepository.save({
      id: timeBlockId1,
      taskId: taskId1,
      createdAt: Date.now(),
      startTime: Date.now() - 3600000,
      endTime: Date.now(),
      rescheduledTimes: 0,
    })

    await timeBlockRepository.save({
      id: timeBlockId2,
      taskId: taskId2,
      createdAt: Date.now(),
      startTime: Date.now() - 7200000,
      endTime: Date.now() - 3600000,
      rescheduledTimes: 1,
    })

    sessionRepository = new KnexSessionRepository(db)
  })

  describe('save', () => {
    test('should insert a new session without intervals', async () => {
      const session: SessionDTO = {
        id: 'session-1',
        taskId: taskId1,
        timeBlockId: timeBlockId1,
        startTime: Date.now() - 300000,
        endTime: null,
        status: 'active',
        intervals: [],
      }

      await sessionRepository.save(session)

      const saved = await sessionRepository.findById('session-1')
      expect(saved).toEqual(session)
    })

    test('should insert a new session with intervals', async () => {
      const interval1: IntervalDTO = {
        sessionId: 'session-2',
        type: 'work',
        startTime: Date.now() - 60000,
        endTime: Date.now() - 30000,
      }
      const interval2: IntervalDTO = {
        sessionId: 'session-2',
        type: 'break',
        startTime: Date.now() - 30000,
        endTime: Date.now(),
      }
      const session: SessionDTO = {
        id: 'session-2',
        taskId: taskId1,
        timeBlockId: timeBlockId1,
        startTime: Date.now() - 60000,
        endTime: Date.now(),
        status: 'completed',
        intervals: [interval1, interval2],
      }

      await sessionRepository.save(session)

      const saved = await sessionRepository.findById('session-2')
      expect(saved).toEqual(session)
    })

    test('should update an existing session and replace intervals', async () => {
      const oldInterval1: IntervalDTO = {
        sessionId: 'session-3',
        type: 'work',
        startTime: Date.now() - 120000,
        endTime: Date.now() - 60000,
      }
      const oldInterval2: IntervalDTO = {
        sessionId: 'session-3',
        type: 'break',
        startTime: Date.now() - 60000,
        endTime: Date.now(),
      }
      const originalSession: SessionDTO = {
        id: 'session-3',
        taskId: taskId1,
        timeBlockId: timeBlockId1,
        startTime: Date.now() - 120000,
        endTime: Date.now(),
        status: 'active',
        intervals: [oldInterval1, oldInterval2],
      }

      await sessionRepository.save(originalSession)

      const newInterval: IntervalDTO = {
        sessionId: 'session-3',
        type: 'work',
        startTime: Date.now() - 30000,
        endTime: Date.now(),
      }
      const updatedSession: SessionDTO = {
        ...originalSession,
        endTime: Date.now() + 10000,
        status: 'completed',
        intervals: [newInterval],
      }

      await sessionRepository.save(updatedSession)

      const saved = await sessionRepository.findById('session-3')
      expect(saved).toEqual(updatedSession)

      const intervalsInDb = await db('interval').where('sessionId', 'session-3')
      expect(intervalsInDb).toHaveLength(1)
      expect(intervalsInDb[0]).toMatchObject({
        sessionId: newInterval.sessionId,
        type: newInterval.type,
        startTime: newInterval.startTime,
        endTime: newInterval.endTime,
      })
    })
  })

  describe('findAll', () => {
    test('should return all sessions with intervals, ordered by startTime desc', async () => {
      const baseTime = Date.now()
      const session1: SessionDTO = {
        id: 's1',
        taskId: taskId1,
        timeBlockId: timeBlockId1,
        startTime: baseTime - 200000,
        endTime: baseTime - 100000,
        status: 'completed',
        intervals: [
          {
            sessionId: 's1',
            type: 'work',
            startTime: baseTime - 200000,
            endTime: baseTime - 150000,
          },
          {
            sessionId: 's1',
            type: 'break',
            startTime: baseTime - 150000,
            endTime: baseTime - 100000,
          },
        ],
      }
      const session2: SessionDTO = {
        id: 's2',
        taskId: taskId2,
        timeBlockId: timeBlockId2,
        startTime: baseTime - 100000,
        endTime: baseTime,
        status: 'completed',
        intervals: [
          {
            sessionId: 's2',
            type: 'work',
            startTime: baseTime - 100000,
            endTime: baseTime - 50000,
          },
          { sessionId: 's2', type: 'break', startTime: baseTime - 50000, endTime: baseTime },
        ],
      }
      const session3: SessionDTO = {
        id: 's3',
        taskId: taskId1,
        timeBlockId: timeBlockId1,
        startTime: baseTime,
        endTime: null,
        status: 'active',
        intervals: [],
      }

      await sessionRepository.save(session1)
      await sessionRepository.save(session2)
      await sessionRepository.save(session3)

      const all = await sessionRepository.findAll()
      expect(all).toHaveLength(3)
      expect(all[0].id).toBe('s3')
      expect(all[1].id).toBe('s2')
      expect(all[2].id).toBe('s1')
      expect(all[0].intervals).toEqual([])
      expect(all[1].intervals).toEqual(session2.intervals)
      expect(all[2].intervals).toEqual(session1.intervals)
    })

    test('should return empty array if no sessions', async () => {
      const all = await sessionRepository.findAll()
      expect(all).toEqual([])
    })
  })

  describe('findAllWithTasks', () => {
    test('should return all sessions with intervals, ordered by startTime desc', async () => {
      const baseTime = Date.now()
      const session1: SessionDTO = {
        id: 's1',
        taskId: taskId1,
        timeBlockId: timeBlockId1,
        startTime: baseTime - 200000,
        endTime: baseTime - 100000,
        status: 'completed',
        intervals: [
          {
            sessionId: 's1',
            type: 'work',
            startTime: baseTime - 200000,
            endTime: baseTime - 150000,
          },
          {
            sessionId: 's1',
            type: 'break',
            startTime: baseTime - 150000,
            endTime: baseTime - 100000,
          },
        ],
      }
      const session2: SessionDTO = {
        id: 's2',
        taskId: taskId2,
        timeBlockId: timeBlockId2,
        startTime: baseTime - 100000,
        endTime: baseTime,
        status: 'completed',
        intervals: [
          {
            sessionId: 's2',
            type: 'work',
            startTime: baseTime - 100000,
            endTime: baseTime - 50000,
          },
          { sessionId: 's2', type: 'break', startTime: baseTime - 50000, endTime: baseTime },
        ],
      }
      const session3: SessionDTO = {
        id: 's3',
        taskId: null,
        timeBlockId: timeBlockId1,
        startTime: baseTime,
        endTime: null,
        status: 'active',
        intervals: [],
      }

      await sessionRepository.save(session1)
      await sessionRepository.save(session2)
      await sessionRepository.save(session3)

      const all = await sessionRepository.findAllWithTasks()

      expect(all).toHaveLength(3)
      expect(all[0].id).toBe('s3')
      expect(all[1].id).toBe('s2')
      expect(all[2].id).toBe('s1')
      expect(all[0].intervals).toEqual([])
      expect(all[1].intervals).toEqual(session2.intervals)
      expect(all[2].intervals).toEqual(session1.intervals)
      expect(all[0].taskTitle).toBeNull()
      expect(all[1].taskTitle).toBe('Task 2')
      expect(all[2].taskTitle).toBe('Task 1')
    })

    test('should return empty array if no sessions', async () => {
      const all = await sessionRepository.findAllWithTasks()
      expect(all).toEqual([])
    })
  })

  describe('findActive', () => {
    test('should return active session with intervals', async () => {
      const activeSession: SessionDTO = {
        id: 'active-1',
        taskId: taskId1,
        timeBlockId: timeBlockId1,
        startTime: Date.now() - 5000,
        endTime: null,
        status: 'active',
        intervals: [
          {
            sessionId: 'active-1',
            type: 'work',
            startTime: Date.now() - 5000,
            endTime: Date.now(),
          },
        ],
      }
      const completedSession: SessionDTO = {
        id: 'completed-1',
        taskId: taskId2,
        timeBlockId: timeBlockId2,
        startTime: Date.now() - 10000,
        endTime: Date.now() - 2000,
        status: 'completed',
        intervals: [],
      }
      await sessionRepository.save(completedSession)
      await sessionRepository.save(activeSession)

      const active = await sessionRepository.findActive()
      expect(active).toEqual(activeSession)
    })

    test('should return null if no active session', async () => {
      const completed: SessionDTO = {
        id: 'c1',
        taskId: taskId1,
        timeBlockId: timeBlockId1,
        startTime: Date.now() - 10000,
        endTime: Date.now(),
        status: 'completed',
        intervals: [],
      }
      await sessionRepository.save(completed)

      const active = await sessionRepository.findActive()
      expect(active).toBeNull()
    })
  })

  describe('findById', () => {
    test('should return session by id with intervals', async () => {
      const session: SessionDTO = {
        id: 'find-id',
        taskId: taskId1,
        timeBlockId: timeBlockId1,
        startTime: Date.now() - 60000,
        endTime: Date.now(),
        status: 'completed',
        intervals: [
          {
            sessionId: 'find-id',
            type: 'work',
            startTime: Date.now() - 60000,
            endTime: Date.now() - 30000,
          },
        ],
      }
      await sessionRepository.save(session)

      const found = await sessionRepository.findById('find-id')
      expect(found).toEqual(session)
    })

    test('should return null if session not found', async () => {
      const found = await sessionRepository.findById('non-existent')
      expect(found).toBeNull()
    })
  })

  describe('findByTaskId', () => {
    test('should return session by task id', async () => {
      const session: SessionDTO = {
        id: 'task-session',
        taskId: taskId1,
        timeBlockId: timeBlockId1,
        startTime: Date.now() - 60000,
        endTime: Date.now(),
        status: 'completed',
        intervals: [],
      }
      await sessionRepository.save(session)

      const found = await sessionRepository.findByTaskId(taskId1)
      expect(found).toEqual(session)
    })

    test('should return null if no session for task id', async () => {
      const found = await sessionRepository.findByTaskId('non-existent-task')
      expect(found).toBeNull()
    })
  })

  describe('findByTimeBlockId', () => {
    test('should return session by timeBlock id', async () => {
      const session: SessionDTO = {
        id: 'tb-session',
        taskId: taskId1,
        timeBlockId: timeBlockId1,
        startTime: Date.now() - 60000,
        endTime: Date.now(),
        status: 'completed',
        intervals: [],
      }
      await sessionRepository.save(session)

      const found = await sessionRepository.findByTimeBlockId(timeBlockId1)
      expect(found).toEqual(session)
    })

    test('should return null if no session for timeBlock id', async () => {
      const found = await sessionRepository.findByTimeBlockId('non-existent-tb')
      expect(found).toBeNull()
    })
  })

  describe('foreign key constraints', () => {
    test('should not allow inserting interval with non-existent sessionId', async () => {
      const invalidInterval = {
        id: 'bad-int',
        sessionId: 'no-session',
        type: 'work',
        startTime: Date.now(),
        endTime: Date.now() + 1000,
      }
      await expect(db('interval').insert(invalidInterval)).rejects.toThrow()
    })

    test('should cascade delete intervals when session is deleted', async () => {
      const session: SessionDTO = {
        id: 'cascade-session',
        taskId: taskId1,
        timeBlockId: timeBlockId1,
        startTime: Date.now() - 60000,
        endTime: Date.now(),
        status: 'completed',
        intervals: [
          {
            sessionId: 'cascade-session',
            type: 'work',
            startTime: Date.now() - 60000,
            endTime: Date.now() - 30000,
          },
        ],
      }
      await sessionRepository.save(session)

      await db('session').where('id', 'cascade-session').delete()

      const intervals = await db('interval').where('sessionId', 'cascade-session')
      expect(intervals).toHaveLength(0)
    })
  })

  test('should maintain interval order by startTime asc', async () => {
    const sessionId = 'order-session'
    const intervals: IntervalDTO[] = [
      { sessionId, type: 'work', startTime: 3000, endTime: 4000 },
      { sessionId, type: 'break', startTime: 1000, endTime: 2000 },
      { sessionId, type: 'work', startTime: 2000, endTime: 3000 },
    ]
    const session: SessionDTO = {
      id: sessionId,
      taskId: taskId1,
      timeBlockId: timeBlockId1,
      startTime: 1000,
      endTime: 4000,
      status: 'completed',
      intervals,
    }
    await sessionRepository.save(session)

    const saved = await sessionRepository.findById(sessionId)
    expect(saved?.intervals.map((i) => i.startTime)).toEqual([1000, 2000, 3000])
  })
})
