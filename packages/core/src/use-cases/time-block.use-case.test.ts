import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScheduleTimeBlockForTask } from './time-block.use-case'
import { TaskEntity, type TaskDTO } from '../entities/task.entity.js'
import type { TaskRepository, TimeBlockRepository } from '../ports/repository.port.js'
import type { PlannerService } from '../services/planner.service.js'
import type { VoidResult } from '../types.js'
import { TimeBlockDTO } from '../entities/time-block.entity'

vi.mock('../entities/task.entity.js', () => ({
  TaskEntity: {
    restore: vi.fn(),
  },
}))

describe('ScheduleTimeBlockForTask', () => {
  const mockPlannerService = {
    schedule: vi.fn<(taskId: string, start: Date, end: Date) => Promise<VoidResult>>(),
    rescheduleTimeBlock: vi.fn<(id: string, start: Date, end: Date) => Promise<VoidResult>>(),
  } as unknown as PlannerService

  const mockTaskRepo = {
    findById: vi.fn<(id: string) => Promise<TaskDTO | null>>(),
  } as unknown as TaskRepository

  const mockTimeBlockRepo = {
    findByTaskId: vi.fn<(taskId: string) => Promise<{ id: string } | null>>(),
  } as unknown as TimeBlockRepository

  let useCase: ScheduleTimeBlockForTask

  beforeEach(() => {
    vi.clearAllMocks()
    useCase = new ScheduleTimeBlockForTask(mockPlannerService, mockTaskRepo, mockTimeBlockRepo)
  })

  const taskId = 'task-123'
  const startTime = new Date('2025-01-01T10:00:00Z')
  const endTime = new Date('2025-01-01T11:00:00Z')

  it('should return error when task is not found', async () => {
    vi.mocked(mockTaskRepo.findById).mockResolvedValue(null)

    const result = await useCase.execute(taskId, startTime, endTime)

    expect(result).toEqual({
      success: false,
      error: `the task with id ${taskId} is not found`,
    })
    expect(mockTaskRepo.findById).toHaveBeenCalledWith(taskId)
    expect(mockPlannerService.schedule).not.toHaveBeenCalled()
    expect(mockPlannerService.rescheduleTimeBlock).not.toHaveBeenCalled()
  })

  it('should return error when task cannot be scheduled', async () => {
    const taskData: TaskDTO = { id: taskId, title: 'Test', status: 'draft' }
    vi.mocked(mockTaskRepo.findById).mockResolvedValue(taskData)

    const mockTaskEntity = {
      canSchedule: vi.fn().mockReturnValue(false),
      status: 'draft',
    } as unknown as TaskEntity

    vi.mocked(TaskEntity.restore).mockReturnValue(mockTaskEntity)

    const result = await useCase.execute(taskId, startTime, endTime)

    expect(result).toEqual({
      success: false,
      error: `the task with id ${taskId} can not be scheduled`,
    })
    expect(TaskEntity.restore).toHaveBeenCalledWith(taskData)
  })

  describe('when task status is draft', () => {
    it('should call plannerService.schedule and return its result', async () => {
      const taskData: TaskDTO = { id: taskId, title: 'Test', status: 'draft' }
      vi.mocked(mockTaskRepo.findById).mockResolvedValue(taskData)

      const mockTaskEntity = {
        canSchedule: vi.fn().mockReturnValue(true),
        status: 'draft',
      } as unknown as TaskEntity

      vi.mocked(TaskEntity.restore).mockReturnValue(mockTaskEntity)

      const scheduleResult: VoidResult = { success: true }
      vi.mocked(mockPlannerService.schedule).mockResolvedValue(scheduleResult)

      const result = await useCase.execute(taskId, startTime, endTime)

      expect(result).toBe(scheduleResult)
      expect(mockPlannerService.schedule).toHaveBeenCalledWith(taskId, startTime, endTime)
      expect(mockPlannerService.rescheduleTimeBlock).not.toHaveBeenCalled()
    })
  })

  describe('when task status is scheduled', () => {
    it('should throw error if time block is not found', async () => {
      const taskData: TaskDTO = { id: taskId, title: 'Test', status: 'scheduled' }
      vi.mocked(mockTaskRepo.findById).mockResolvedValue(taskData)

      const mockTaskEntity = {
        canSchedule: vi.fn().mockReturnValue(true),
        status: 'scheduled',
      } as unknown as TaskEntity

      vi.mocked(TaskEntity.restore).mockReturnValue(mockTaskEntity)
      vi.mocked(mockTimeBlockRepo.findByTaskId).mockResolvedValue(null)

      await expect(useCase.execute(taskId, startTime, endTime)).rejects.toThrow(
        `can not find time block for task with id ${taskId}`
      )
      expect(mockPlannerService.rescheduleTimeBlock).not.toHaveBeenCalled()
    })

    it('should call plannerService.rescheduleTimeBlock with found time block id', async () => {
      const taskData: TaskDTO = { id: taskId, title: 'Test', status: 'scheduled' }
      vi.mocked(mockTaskRepo.findById).mockResolvedValue(taskData)

      const mockTaskEntity = {
        canSchedule: vi.fn().mockReturnValue(true),
        status: 'scheduled',
      } as unknown as TaskEntity

      vi.mocked(TaskEntity.restore).mockReturnValue(mockTaskEntity)

      const timeBlock = { id: 'tb-456' } as TimeBlockDTO
      vi.mocked(mockTimeBlockRepo.findByTaskId).mockResolvedValue(timeBlock)

      const rescheduleResult: VoidResult = { success: true }
      vi.mocked(mockPlannerService.rescheduleTimeBlock).mockResolvedValue(rescheduleResult)

      const result = await useCase.execute(taskId, startTime, endTime)

      expect(result).toBe(rescheduleResult)
      expect(mockPlannerService.rescheduleTimeBlock).toHaveBeenCalledWith(
        timeBlock.id,
        startTime,
        endTime
      )
    })
  })

  it('should throw error for unhandled task status', async () => {
    const taskData: TaskDTO = { id: taskId, title: 'Test', status: 'in_progress' }
    vi.mocked(mockTaskRepo.findById).mockResolvedValue(taskData)

    const mockTaskEntity = {
      canSchedule: vi.fn().mockReturnValue(true),
      status: 'in_progress',
    } as unknown as TaskEntity

    vi.mocked(TaskEntity.restore).mockReturnValue(mockTaskEntity)

    await expect(useCase.execute(taskId, startTime, endTime)).rejects.toThrow(
      'unhandled task status in scheduling'
    )
    expect(mockPlannerService.schedule).not.toHaveBeenCalled()
    expect(mockPlannerService.rescheduleTimeBlock).not.toHaveBeenCalled()
  })
})
