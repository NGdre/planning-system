import { TimeBlockRepository } from '../ports/repository.port.js'
import { TaskService } from '../services/task.service.js'
import { TimeTrackingService } from '../services/time-tracking.service.js'
import { VoidResult } from '../types.js'

/**
 * Use case for starting a session associated with a specific task.
 * This involves starting the task itself and then beginning a time tracking session.
 */
export class StartTaskSessionUseCase {
  /**
   * Creates an instance of StartTaskSessionUseCase.
   * @param timeBlockRepository - Repository to find time blocks by task ID.
   * @param taskService - Service to manage task operations (e.g., startTask).
   * @param  timeTrackingService - Service to manage time tracking sessions.
   */
  constructor(
    private readonly timeBlockRepository: TimeBlockRepository,
    private readonly taskService: TaskService,
    private readonly timeTrackingService: TimeTrackingService
  ) {}

  /**
   * Executes the use case to start a task session.
   * @param taskId - The ID of the task to start a session for.
   * @returns A promise resolving to a VoidResult indicating success or failure.
   */
  async execute(taskId: string): Promise<VoidResult> {
    try {
      const timeBlockDTO = await this.timeBlockRepository.findByTaskId(taskId)

      // TODO: should be a transaction
      const taskStartResult = this.taskService.startTask(taskId)

      if (!taskStartResult) return taskStartResult

      return await this.timeTrackingService.startSession({
        taskId,
        timeBlockId: timeBlockDTO?.id || null,
      })
    } catch (error) {
      console.error('Failed to start scheduled session:', error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

/**
 * Use case for starting a free (taskless) session.
 * It directly starts a time tracking session without associating it with a task or time block.
 */
export class StartFreeSessionUseCase {
  /**
   * Creates an instance of StartFreeSessionUseCase.
   * @param timeTrackingService - Service to manage time tracking sessions.
   */
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  /**
   * Executes the use case to start a free session.
   * @returns A promise resolving to a VoidResult indicating success or failure.
   */
  async execute(): Promise<VoidResult> {
    return await this.timeTrackingService.startSession({ taskId: null, timeBlockId: null })
  }
}

/**
 * Use case for pausing the current active session.
 */
export class PauseSessionUseCase {
  /**
   * Creates an instance of PauseSessionUseCase.
   * @param timeTrackingService - Service to manage time tracking sessions.
   */
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  /**
   * Executes the use case to pause the current session.
   * @returns A promise resolving to a VoidResult indicating success or failure.
   */
  async execute(): Promise<VoidResult> {
    return await this.timeTrackingService.pauseSession()
  }
}

/**
 * Use case for resuming a previously paused session.
 */
export class ResumeSessionUseCase {
  /**
   * Creates an instance of ResumeSessionUseCase.
   * @param timeTrackingService - Service to manage time tracking sessions.
   */
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  /**
   * Executes the use case to resume the current session.
   * @returns A promise resolving to a VoidResult indicating success or failure.
   */
  async execute(): Promise<VoidResult> {
    return await this.timeTrackingService.resumeSession()
  }
}

/**
 * Use case for stopping the current active session.
 */
export class StopSessionUseCase {
  /**
   * Creates an instance of StopSessionUseCase.
   * @param timeTrackingService - Service to manage time tracking sessions.
   */
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  /**
   * Executes the use case to stop the current session.
   * @returns A promise resolving to a VoidResult indicating success or failure.
   */
  async execute(): Promise<VoidResult> {
    return await this.timeTrackingService.stopSession()
  }
}

/**
 * Use case for retrieving all time tracking sessions.
 */
export class FindAllSessionUseCase {
  /**
   * Creates an instance of FindAllSessionUseCase.
   * @param  timeTrackingService - Service to manage time tracking sessions.
   */
  constructor(private readonly timeTrackingService: TimeTrackingService) {}

  /**
   * Executes the use case to find all sessions.
   * @returns A promise resolving to a VoidResult containing the sessions data on success.
   */
  async execute(): Promise<VoidResult> {
    return await this.timeTrackingService.findAllSessions()
  }
}
