import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SessionDTO } from '../entities/session.entity'
import { TaskDTO } from '../entities/task.entity'
import { TimeBlockDTO } from '../entities/time-block.entity'
import type {
  SessionRepository,
  TaskRepository,
  TimeBlockRepository,
} from '../ports/repository.port.js'
import type { TaskService } from '../services/task.service.js'
import type { TimeTrackingService } from '../services/time-tracking.service.js'
import type { VoidResult } from '../types.js'
import {
  FetchSessionDetailsUseCase,
  SessionDetails,
  StartFreeSessionUseCase,
  StartTaskSessionUseCase,
} from './session.use-case'
import { UserActionsService } from '../services/user-actions.service'

describe('Session Use Cases', () => {
  let mockTimeBlockRepository: TimeBlockRepository
  let mockTaskService: TaskService
  let mockTimeTrackingService: TimeTrackingService
  let mockUserActionsService: UserActionsService
  let mockSessionRepository: SessionRepository
  let mockTaskRepository: TaskRepository

  beforeEach(() => {
    mockTimeBlockRepository = {
      findByTaskId: vi.fn(),
      findById: vi.fn(),
    } as unknown as TimeBlockRepository

    mockTaskService = {
      startTask: vi.fn(),
    } as unknown as TaskService

    mockTimeTrackingService = {
      startSession: vi.fn(),
      pauseSession: vi.fn(),
      resumeSession: vi.fn(),
      stopSession: vi.fn(),
      findAllSessions: vi.fn(),
      getTotalWorkTime: vi.fn(),
    } as unknown as TimeTrackingService

    mockUserActionsService = {
      getSessionActions: vi.fn(),
    } as unknown as UserActionsService

    mockSessionRepository = {
      findById: vi.fn(),
      findActive: vi.fn(),
    } as unknown as SessionRepository
    mockTaskRepository = { findById: vi.fn() } as unknown as TaskRepository
  })

  describe('StartTaskSessionUseCase', () => {
    let useCase: StartTaskSessionUseCase

    beforeEach(() => {
      useCase = new StartTaskSessionUseCase(
        mockTimeBlockRepository,
        mockTaskService,
        mockTimeTrackingService
      )
    })

    it('should start task and then start session when task service succeeds and no time block exists', async () => {
      const taskId = 'task-123'
      const taskStartResult: VoidResult = { success: true }
      const sessionStartResult: VoidResult = { success: true }

      vi.mocked(mockTimeBlockRepository.findByTaskId).mockResolvedValue(null)
      vi.mocked(mockTaskService.startTask).mockResolvedValue(taskStartResult)
      vi.mocked(mockTimeTrackingService.startSession).mockResolvedValue(sessionStartResult)

      const result = await useCase.execute(taskId)

      expect(result).toBe(sessionStartResult)
      expect(mockTimeBlockRepository.findByTaskId).toHaveBeenCalledWith(taskId)
      expect(mockTaskService.startTask).toHaveBeenCalledWith(taskId)
      expect(mockTimeTrackingService.startSession).toHaveBeenCalledWith({
        taskId,
        timeBlockId: null,
      })
    })

    it('should start task and then start session when task service succeeds and time block exists', async () => {
      const taskId = 'task-123'
      const timeBlockDTO = { id: 'block-456' }
      const taskStartResult: VoidResult = { success: true }
      const sessionStartResult: VoidResult = { success: true }

      vi.mocked(mockTimeBlockRepository.findByTaskId).mockResolvedValue(
        timeBlockDTO as TimeBlockDTO
      )
      vi.mocked(mockTaskService.startTask).mockResolvedValue(taskStartResult)
      vi.mocked(mockTimeTrackingService.startSession).mockResolvedValue(sessionStartResult)

      const result = await useCase.execute(taskId)

      expect(result).toBe(sessionStartResult)
      expect(mockTimeTrackingService.startSession).toHaveBeenCalledWith({
        taskId,
        timeBlockId: 'block-456',
      })
    })
  })

  describe('StartFreeSessionUseCase', () => {
    let useCase: StartFreeSessionUseCase

    beforeEach(() => {
      useCase = new StartFreeSessionUseCase(mockTimeTrackingService)
    })

    it('should call startSession with null taskId and timeBlockId', async () => {
      const expectedResult: VoidResult = { success: true }
      vi.mocked(mockTimeTrackingService.startSession).mockResolvedValue(expectedResult)

      const result = await useCase.execute()

      expect(result).toBe(expectedResult)
      expect(mockTimeTrackingService.startSession).toHaveBeenCalledWith({
        taskId: null,
        timeBlockId: null,
      })
    })
  })

  describe('FetchSessionDetailsUseCase', () => {
    const mockSession: SessionDTO = {
      id: 'session-1',
      taskId: 'task-1',
      timeBlockId: 'tb-1',
      startTime: 1000,
      endTime: 2000,
      status: 'completed',
      intervals: [],
    }

    const mockTask = { id: 'task-1', title: 'Test Task' } as TaskDTO
    const mockTimeBlock = { id: 'tb-1', startTime: 500, endTime: 2500 } as TimeBlockDTO

    let useCase: FetchSessionDetailsUseCase

    beforeEach(() => {
      useCase = new FetchSessionDetailsUseCase(
        mockSessionRepository,
        mockTaskRepository,
        mockTimeBlockRepository,
        mockTimeTrackingService,
        mockUserActionsService
      )
    })

    it('should return session details when all data is found', async () => {
      vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession)
      vi.mocked(mockTaskRepository.findById).mockResolvedValue(mockTask)
      vi.mocked(mockTimeBlockRepository.findById).mockResolvedValue(mockTimeBlock)
      vi.mocked(mockTimeTrackingService.getTotalWorkTime).mockReturnValue(150)

      const result = await useCase.execute('session-1')

      expect(result.success).toBe(true)

      const value = (result as { success: true; value: SessionDetails }).value
      expect(value).toMatchObject({
        ...mockSession,
        taskTitle: 'Test Task',
        timeBlock: { startTime: 500, endTime: 2500 },
        totalWorkTime: 150,
      })
      expect(mockSessionRepository.findById).toHaveBeenCalledWith('session-1')
      expect(mockTaskRepository.findById).toHaveBeenCalledWith('task-1')
      expect(mockTimeBlockRepository.findById).toHaveBeenCalledWith('tb-1')
      expect(mockTimeTrackingService.getTotalWorkTime).toHaveBeenCalledWith(mockSession)
      expect(mockUserActionsService.getSessionActions).toHaveBeenCalledWith(mockSession)
    })

    it('should return active session details when there is no sessionId', async () => {
      vi.mocked(mockSessionRepository.findActive).mockResolvedValue(mockSession)

      const result = await useCase.execute()

      expect(result.success).toBe(true)

      const value = (result as { success: true; value: SessionDetails }).value
      expect(value).toMatchObject(mockSession)
      expect(mockSessionRepository.findActive).toHaveBeenCalledOnce()
    })

    it('should return error when session is not found', async () => {
      vi.mocked(mockSessionRepository.findById).mockResolvedValue(null)

      const result = await useCase.execute('invalid-id')

      expect(result.success).toBe(false)
      expect((result as { success: false; error: string }).error).toBe(
        'Failed to find session with id: invalid-id'
      )
      expect(mockTaskRepository.findById).not.toHaveBeenCalled()
      expect(mockTimeBlockRepository.findById).not.toHaveBeenCalled()
      expect(mockTimeTrackingService.getTotalWorkTime).not.toHaveBeenCalled()
      expect(mockUserActionsService.getSessionActions).not.toHaveBeenCalled()
    })

    it('should handle free sessions', async () => {
      const sessionWithoutTask = { ...mockSession, taskId: null, timeBlockId: null }
      vi.mocked(mockSessionRepository.findById).mockResolvedValue(sessionWithoutTask)
      vi.mocked(mockTimeTrackingService.getTotalWorkTime).mockReturnValue(500)

      const result = await useCase.execute('session-1')

      expect(result.success).toBe(true)
      const value = (result as { success: true; value: SessionDetails }).value
      expect(value.taskTitle).toBeUndefined()
      expect(value.timeBlock).toBeUndefined()
      expect(mockTaskRepository.findById).not.toHaveBeenCalled()
      expect(mockTimeBlockRepository.findById).not.toHaveBeenCalled()
    })

    it('should handle immediate sessions', async () => {
      const sessionWithoutTimeBlock = { ...mockSession, timeBlockId: null }
      vi.mocked(mockSessionRepository.findById).mockResolvedValue(sessionWithoutTimeBlock)
      vi.mocked(mockTaskRepository.findById).mockResolvedValue(mockTask)
      vi.mocked(mockTimeTrackingService.getTotalWorkTime).mockReturnValue(150)

      const result = await useCase.execute('session-1')

      expect(result.success).toBe(true)
      const value = (result as { success: true; value: SessionDetails }).value
      expect(value.timeBlock).toBeUndefined()
      expect(mockTimeBlockRepository.findById).not.toHaveBeenCalled()
      expect(mockTaskRepository.findById).toHaveBeenCalled()
    })

    it('should return error when sessionRepository throws', async () => {
      const error = new Error('DB connection failed')
      vi.mocked(mockSessionRepository.findById).mockRejectedValue(error)

      const result = await useCase.execute('session-1')

      expect(result.success).toBe(false)
      expect((result as { success: false; error: string }).error).toBe('DB connection failed')
    })
  })
})
