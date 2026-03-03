import { TaskEntity } from '../entities/task.entity.js'
import { TaskRepository } from '../ports/repository.port.js'
import { VoidResult } from '../types.js'

/**
 * Service responsible for task-related operations.
 * Orchestrates interactions with the task repository and domain entity.
 */
export class TaskService {
  /**
   * Creates an instance of TaskService.
   * @param taskRepository - The repository used for task persistence.
   */
  constructor(private readonly taskRepository: TaskRepository) {}

  /**
   * Starts a task identified by its ID.
   * Retrieves the task, validates its state, transitions to 'in_progress', and persists the change.
   * @param taskId - The unique identifier of the task to start.
   * @returns A promise resolving to a VoidResult indicating success or failure.
   */
  async startTask(taskId: string): Promise<VoidResult> {
    try {
      const taskDTO = await this.taskRepository.findById(taskId)

      if (!taskDTO)
        return {
          success: false,
          error: 'Failed to find task with id: ' + taskId,
        }

      const task = TaskEntity.restore(taskDTO)

      task.start()

      await this.taskRepository.save(task.toData())

      return {
        success: true,
      }
    } catch (error) {
      console.error('Failed to start task:', error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
