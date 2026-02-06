import { Entity } from './Entity'
import { TaskDTO, TaskEntity } from './task.entity'
import { describe, test, expect } from 'vitest'

describe('TaskEntity', () => {
  test('creates TaskEntity instance', () => {
    const te = TaskEntity.create(() => 'id1', {
      title: 'task1',
    })

    expect(te.title).toBe('task1')
    expect(te.status).toBe('draft')
    expect(te.scheduledTimeBlock).toBeUndefined()
  })

  test('toData works correctly with draft task', () => {
    const te = TaskEntity.create(() => 'id1', {
      title: 'task1',
    })

    expect(te.toData()).toEqual({
      id: 'id1',
      title: 'task1',
      status: 'draft',
    })
  })

  test('toData works correctly with scheduled task', () => {
    const te = TaskEntity.create(() => 'id1', {
      title: 'task1',
    })

    const tb = { startTime: new Date(2026, 10, 24, 5), endTime: new Date(2026, 10, 24, 6) }

    te.schedule(tb)

    expect(te.toData()).toEqual({
      id: 'id1',
      title: 'task1',
      status: 'scheduled',
      scheduledTimeBlock: {
        endTime: '2026-11-24T03:00:00.000Z',
        startTime: '2026-11-24T02:00:00.000Z',
      },
    })
  })

  test('restores TaskEntity correctly from persisted data', () => {
    const persistedTaskData: TaskDTO = {
      id: 'id1',
      title: 'task1',
      status: 'draft',
    }

    const te = TaskEntity.create(() => 'id1', {
      title: 'task1',
    })

    expect(TaskEntity.restore(persistedTaskData)).toEqual(te)

    const tb = { startTime: new Date(2026, 10, 24, 5), endTime: new Date(2026, 10, 24, 6) }

    te.schedule(tb)

    persistedTaskData.status = 'scheduled'
    persistedTaskData.scheduledTimeBlock = {
      endTime: '2026-11-24T03:00:00.000Z',
      startTime: '2026-11-24T02:00:00.000Z',
    }

    expect(TaskEntity.restore(persistedTaskData)).toEqual(te)
  })

  test('TaskEntity is prototype of Entity', () => {
    expect(Object.getPrototypeOf(TaskEntity)).toBe(Entity)
  })
})
