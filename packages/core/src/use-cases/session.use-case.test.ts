import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TimeBlockDTO } from '../entities/time-block.entity'
import type { TimeBlockRepository } from '../ports/repository.port.js'
import type { TaskService } from '../services/task.service.js'
import type { TimeTrackingService } from '../services/time-tracking.service.js'
import type { VoidResult } from '../types.js'
import { StartFreeSessionUseCase, StartTaskSessionUseCase } from './session.use-case'

describe('Session Use Cases', () => {
  let mockTimeBlockRepository: TimeBlockRepository
  let mockTaskService: TaskService
  let mockTimeTrackingService: TimeTrackingService

  beforeEach(() => {
    mockTimeBlockRepository = {
      findByTaskId: vi.fn(),
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
    } as unknown as TimeTrackingService
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
})
