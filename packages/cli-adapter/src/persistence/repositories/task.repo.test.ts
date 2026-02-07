import { describe, test, expect, beforeEach } from 'vitest'
import { setupTestDb } from '../../utils/test-db-setup'
import { KnexTaskRepository } from './task.repo'
import { TaskDTO } from '@planning-system/core'

const getTestDb = setupTestDb()
let taskRepository: KnexTaskRepository

describe('TaskRepository', () => {
  beforeEach(() => {
    const db = getTestDb()
    taskRepository = new KnexTaskRepository(db)
  })

  test('saves task into DB', async () => {
    const task: TaskDTO = {
      id: 'id1',
      title: 'new-task',
      status: 'draft',
    }

    await taskRepository.save(task)

    expect(await taskRepository.findById('id1')).toEqual(task)
  })

  test('find all tasks in DB', async () => {
    const task1: TaskDTO = {
      id: 'id1',
      title: 'new-task1',
      status: 'draft',
    }

    const task2: TaskDTO = {
      id: 'id2',
      title: 'new-task2',
      status: 'draft',
    }

    const task3: TaskDTO = {
      id: 'id3',
      title: 'new-task3',
      status: 'draft',
    }

    await taskRepository.save(task1)
    await taskRepository.save(task2)
    await taskRepository.save(task3)

    expect(await taskRepository.findAll()).toEqual([task1, task2, task3])
  })

  test('returns null when task not found', async () => {
    const result = await taskRepository.findById('non-existent-id')
    expect(result).toBeNull()
  })

  test('updates existing task', async () => {
    const initialTask: TaskDTO = {
      id: 'id1',
      title: 'initial-title',
      status: 'draft',
    }

    await taskRepository.save(initialTask)

    const updatedTask = { ...initialTask, title: 'updated-title' }
    await taskRepository.save(updatedTask)

    const saved = await taskRepository.findById('id1')
    expect(saved?.title).toBe('updated-title')
  })

  test('does not create duplicate tasks with same id', async () => {
    const task: TaskDTO = {
      id: 'duplicate-id',
      title: 'task',
      status: 'draft',
    }

    await taskRepository.save(task)
    await taskRepository.save(task)

    const allTasks = await taskRepository.findAll()
    expect(allTasks).toHaveLength(1)
  })
})
