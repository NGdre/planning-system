import { describe, test, expect } from 'vitest'
import { SessionAction, TaskAction, UserActionsService } from './user-actions.service'
import { TaskDTO } from '../entities/task.entity'
import { SessionDTO } from '../entities/session.entity'

describe('UserActionsService', () => {
  test('task actions when status is draft', () => {
    const task: TaskDTO = {
      id: 'id1',
      title: 'todo1',
      status: 'draft',
    }

    expect(new UserActionsService().getTaskActions(task)).toEqual([
      TaskAction.START,
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

  test('session action when session is paused', () => {
    const sessionStartTime = new Date('2024-01-01T10:00:00Z')
    const firstIntervalEndTime = new Date(sessionStartTime.getTime() + 20 * 60 * 1000)

    const session: SessionDTO = {
      id: 'sess-456',
      taskId: null,
      timeBlockId: null,
      status: 'active',
      intervals: [
        {
          sessionId: 'sess-456',
          type: 'work',
          startTime: sessionStartTime.getTime(),
          endTime: firstIntervalEndTime.getTime(),
        },
        {
          sessionId: 'sess-456',
          type: 'break',
          startTime: firstIntervalEndTime.getTime(),
          endTime: null,
        },
      ],
      startTime: sessionStartTime.getTime(),
      endTime: null,
    }

    expect(new UserActionsService().getSessionActions(session)).toEqual([
      SessionAction.RESUME,
      SessionAction.STOP,
    ])
  })

  test('session action when session is active and is not paused', () => {
    const sessionStartTime = new Date('2024-01-01T10:00:00Z')

    const session: SessionDTO = {
      id: 'sess-456',
      taskId: null,
      timeBlockId: null,
      status: 'active',
      intervals: [
        {
          sessionId: 'sess-456',
          type: 'work',
          startTime: sessionStartTime.getTime(),
          endTime: null,
        },
      ],
      startTime: sessionStartTime.getTime(),
      endTime: null,
    }

    expect(new UserActionsService().getSessionActions(session)).toEqual([
      SessionAction.PAUSE,
      SessionAction.STOP,
    ])
  })

  test('session action when session is completed', () => {
    const sessionStartTime = new Date('2024-01-01T10:00:00Z')
    const sessionEndTime = new Date(sessionStartTime.getTime() + 20 * 60 * 1000)

    const session: SessionDTO = {
      id: 'sess-456',
      taskId: null,
      timeBlockId: null,
      status: 'completed',
      intervals: [
        {
          sessionId: 'sess-456',
          type: 'work',
          startTime: sessionStartTime.getTime(),
          endTime: sessionEndTime.getTime(),
        },
      ],
      startTime: sessionStartTime.getTime(),
      endTime: sessionEndTime.getTime(),
    }

    expect(new UserActionsService().getSessionActions(session)).toEqual([])
  })
})
