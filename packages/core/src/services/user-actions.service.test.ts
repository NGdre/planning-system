import { describe, test, expect } from 'vitest'
import { TaskAction, UserActionsService } from './user-actions.service'
import { TaskDTO } from 'packages/core/dist'

describe('UserActionsService', () => {
  test('task actions when status is draft', () => {
    const task: TaskDTO = {
      id: 'id1',
      title: 'todo1',
      status: 'draft',
    }

    expect(new UserActionsService().getTaskActions(task)).toEqual([
      TaskAction.SCHEDULE,
      TaskAction.EDIT,
      TaskAction.COMPLETE,
      TaskAction.DELETE,
    ])
  })

  test('task actions when status is scheduled', () => {
    const task: TaskDTO = {
      id: 'id1',
      title: 'todo1',
      status: 'scheduled',
    }

    expect(new UserActionsService().getTaskActions(task)).toEqual([
      TaskAction.START,
      TaskAction.SCHEDULE,
      TaskAction.EDIT,
      TaskAction.CANCEL,
    ])
  })

  test('task actions when status is in_progress', () => {
    const task: TaskDTO = {
      id: 'id1',
      title: 'todo1',
      status: 'in_progress',
    }

    expect(new UserActionsService().getTaskActions(task)).toEqual([
      TaskAction.EDIT,
      TaskAction.CANCEL,
      TaskAction.COMPLETE,
    ])
  })

  test('task actions when status is canceled', () => {
    const task: TaskDTO = {
      id: 'id1',
      title: 'todo1',
      status: 'canceled',
    }

    expect(new UserActionsService().getTaskActions(task)).toEqual([])
  })

  test('task actions when status is completed', () => {
    const task: TaskDTO = {
      id: 'id1',
      title: 'todo1',
      status: 'completed',
    }

    expect(new UserActionsService().getTaskActions(task)).toEqual([])
  })
})
