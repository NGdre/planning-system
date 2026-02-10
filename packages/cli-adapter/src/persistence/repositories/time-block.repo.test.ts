import { TaskDTO, TimeBlockDTO } from '@planning-system/core'
import { beforeEach, describe, expect, test } from 'vitest'
import { setupTestDb } from '../../utils/test-db-setup'
import { KnexTaskRepository } from './task.repo'
import { KnexTimeBlockRepository } from './time-block.repo'

const getTestDb = setupTestDb()
let timeBlockRepository: KnexTimeBlockRepository

describe('TimeBlockRepository', () => {
  beforeEach(async () => {
    const db = getTestDb()

    const taskRepository = new KnexTaskRepository(db)

    const task1: TaskDTO = {
      id: 'taskId1',
      title: 'new-task1',
      status: 'draft',
    }

    const task2: TaskDTO = {
      id: 'taskId2',
      title: 'new-task2',
      status: 'draft',
    }

    const task3: TaskDTO = {
      id: 'taskId3',
      title: 'new-task3',
      status: 'draft',
    }

    const task4: TaskDTO = {
      id: 'taskId4',
      title: 'new-task4',
      status: 'draft',
    }

    await taskRepository.save(task1)
    await taskRepository.save(task2)
    await taskRepository.save(task3)
    await taskRepository.save(task4)

    timeBlockRepository = new KnexTimeBlockRepository(db)
  })

  test('saves time block into DB', async () => {
    const createdAt = Date.now()

    const timeBlock: TimeBlockDTO = {
      id: 'id1',
      taskId: 'taskId1',
      createdAt,
      startTime: new Date('2024-01-01T11:00:00').getTime(),
      endTime: new Date('2024-01-01T12:00:00').getTime(),
      rescheduledTimes: 0,
    }

    await timeBlockRepository.save(timeBlock)

    expect(await timeBlockRepository.findById('id1')).toEqual(timeBlock)
  })

  test('find all time blocks in DB', async () => {
    const timeBlock1: TimeBlockDTO = {
      id: 'id1',
      taskId: 'taskId1',
      createdAt: Date.now(),
      startTime: new Date('2024-01-01T11:00:00').getTime(),
      endTime: new Date('2024-01-01T12:00:00').getTime(),
      rescheduledTimes: 0,
    }

    const timeBlock2: TimeBlockDTO = {
      id: 'id2',
      taskId: 'taskId2',
      createdAt: Date.now(),
      startTime: new Date('2024-01-01T12:00:00').getTime(),
      endTime: new Date('2024-01-01T13:00:00').getTime(),
      rescheduledTimes: 4,
    }

    const timeBlock3: TimeBlockDTO = {
      id: 'id3',
      taskId: 'taskId3',
      createdAt: Date.now(),
      startTime: new Date('2024-01-01T14:00:00').getTime(),
      endTime: new Date('2024-01-01T15:00:00').getTime(),
      rescheduledTimes: 2,
    }

    await timeBlockRepository.save(timeBlock1)
    await timeBlockRepository.save(timeBlock2)
    await timeBlockRepository.save(timeBlock3)

    expect(await timeBlockRepository.findAll()).toEqual([timeBlock1, timeBlock2, timeBlock3])
  })

  test('find all time blocks within date range', async () => {
    const timeBlock1: TimeBlockDTO = {
      id: 'id1',
      taskId: 'taskId1',
      createdAt: Date.now(),
      startTime: new Date('2024-01-01T11:00:00').getTime(),
      endTime: new Date('2024-01-01T12:00:00').getTime(),
      rescheduledTimes: 0,
    }

    const timeBlock2: TimeBlockDTO = {
      id: 'id2',
      taskId: 'taskId2',
      createdAt: Date.now(),
      startTime: new Date('2024-01-01T12:00:00').getTime(),
      endTime: new Date('2024-01-01T13:00:00').getTime(),
      rescheduledTimes: 4,
    }

    const timeBlock3: TimeBlockDTO = {
      id: 'id3',
      taskId: 'taskId3',
      createdAt: Date.now(),
      startTime: new Date('2024-01-01T14:00:00').getTime(),
      endTime: new Date('2024-01-01T15:00:00').getTime(),
      rescheduledTimes: 2,
    }

    const timeBlock4: TimeBlockDTO = {
      id: 'id4',
      taskId: 'taskId4',
      createdAt: Date.now(),
      startTime: new Date('2024-01-01T15:00:00').getTime(),
      endTime: new Date('2024-01-01T16:00:00').getTime(),
      rescheduledTimes: 2,
    }

    await timeBlockRepository.save(timeBlock1)
    await timeBlockRepository.save(timeBlock2)
    await timeBlockRepository.save(timeBlock3)
    await timeBlockRepository.save(timeBlock4)

    expect(
      await timeBlockRepository.findAllWithin(
        new Date('2024-01-01T12:00:00').getTime(),
        new Date('2024-01-01T15:00:00').getTime()
      )
    ).toEqual([timeBlock2, timeBlock3])
  })

  test('returns null when time block is not found', async () => {
    const result1 = await timeBlockRepository.findById('non-existent-id')
    const result2 = await timeBlockRepository.findByTaskId('non-existent-task-id')
    expect(result1).toBeNull()
    expect(result2).toBeNull()
  })

  test('find time block by task id', async () => {
    const createdAt = Date.now()

    const timeBlock: TimeBlockDTO = {
      id: 'id1',
      taskId: 'taskId1',
      createdAt,
      startTime: new Date('2024-01-01T11:00:00').getTime(),
      endTime: new Date('2024-01-01T12:00:00').getTime(),
      rescheduledTimes: 0,
    }

    await timeBlockRepository.save(timeBlock)

    expect(await timeBlockRepository.findByTaskId('taskId1')).toEqual(timeBlock)
  })

  test('updates existing time block', async () => {
    const timeBlock1: TimeBlockDTO = {
      id: 'id1',
      taskId: 'taskId1',
      createdAt: Date.now(),
      startTime: new Date('2024-01-01T11:00:00').getTime(),
      endTime: new Date('2024-01-01T12:00:00').getTime(),
      rescheduledTimes: 0,
    }

    await timeBlockRepository.save(timeBlock1)

    const updatedTask = {
      ...timeBlock1,
      startTime: new Date('2024-01-02T11:00:00').getTime(),
      endTime: new Date('2024-01-02T12:00:00').getTime(),
    }
    await timeBlockRepository.save(updatedTask)

    const saved = await timeBlockRepository.findById('id1')
    expect(saved?.startTime).toBe(new Date('2024-01-02T11:00:00').getTime())
    expect(saved?.endTime).toBe(new Date('2024-01-02T12:00:00').getTime())
  })

  test('does not create duplicate time blocks with the same id', async () => {
    const timeBlock1: TimeBlockDTO = {
      id: 'id1',
      taskId: 'taskId1',
      createdAt: Date.now(),
      startTime: new Date('2024-01-01T11:00:00').getTime(),
      endTime: new Date('2024-01-01T12:00:00').getTime(),
      rescheduledTimes: 0,
    }

    await timeBlockRepository.save(timeBlock1)
    await timeBlockRepository.save(timeBlock1)

    const allTasks = await timeBlockRepository.findAll()
    expect(allTasks).toHaveLength(1)
  })
})
