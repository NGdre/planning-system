import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TaskService } from './task.service.js'
import type { TaskRepository } from '../ports/repository.port.js'
import type { TaskDTO } from '../entities/task.entity.js'

describe('TaskService', () => {
  let mockRepository: TaskRepository
  let service: TaskService

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      save: vi.fn(),
    } as unknown as TaskRepository

    service = new TaskService(mockRepository)
  })

  describe('startTask', () => {
    it('should successfully start a task when found and state allows', async () => {
      const taskDTO: TaskDTO = {
        id: 'task-1',
        title: 'Test Task',
        status: 'draft',
      }
      vi.mocked(mockRepository.findById).mockResolvedValue(taskDTO)

      const result = await service.startTask('task-1')

      expect(result).toEqual({ success: true })
      expect(mockRepository.findById).toHaveBeenCalledWith('task-1')
      expect(mockRepository.save).toHaveBeenCalledOnce()
      const savedDTO = vi.mocked(mockRepository.save).mock.calls[0][0]
      expect(savedDTO).toMatchObject({
        id: 'task-1',
        title: 'Test Task',
        status: 'in_progress',
      })
    })

    it('should return error when task is not found', async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null)

      const result = await service.startTask('missing-id')

      expect(result).toEqual({
        success: false,
        error: 'Failed to find task with id: missing-id',
      })
      expect(mockRepository.save).not.toHaveBeenCalled()
    })

    it('should return error when task cannot be started (invalid state)', async () => {
      const taskDTO: TaskDTO = {
        id: 'task-2',
        title: 'Completed Task',
        status: 'completed',
      }
      vi.mocked(mockRepository.findById).mockResolvedValue(taskDTO)

      const result = await service.startTask('task-2')

      expect(result).toEqual({
        success: false,
        error: 'can not start task',
      })
      expect(mockRepository.save).not.toHaveBeenCalled()
    })

    it('should return error when repository save fails', async () => {
      const taskDTO: TaskDTO = {
        id: 'task-3',
        title: 'Test',
        status: 'draft',
      }
      vi.mocked(mockRepository.findById).mockResolvedValue(taskDTO)
      const saveError = new Error('Database connection lost')
      vi.mocked(mockRepository.save).mockRejectedValue(saveError)

      const result = await service.startTask('task-3')

      expect(result).toEqual({
        success: false,
        error: 'Database connection lost',
      })
    })
  })
})
