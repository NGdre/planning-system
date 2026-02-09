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
  })

  test('TaskEntity is prototype of Entity', () => {
    expect(Object.getPrototypeOf(TaskEntity)).toBe(Entity)
  })
})
