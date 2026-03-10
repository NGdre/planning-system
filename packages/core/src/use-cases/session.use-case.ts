import { SessionDTO } from '../entities/session.entity.js'
import { SessionRepository, TaskRepository, TimeBlockRepository } from '../ports/repository.port.js'
import { TaskService } from '../services/task.service.js'
import { TimeTrackingService } from '../services/time-tracking.service.js'
import { SessionAction, UserActionsService } from '../services/user-actions.service.js'
import { Result, VoidResult } from '../types.js'

/**
 * Detailed session information, enriched with related data and computed fields.
 */
export interface SessionDetails extends SessionDTO {
  /** Title of the associated task for task sessions. */
  taskTitle?: string
  /** Time block interval if a time block is associated for scheduled sessions. */
  timeBlock?: {
    /** Start timestamp of the time block. */
    startTime: number
    /** End timestamp of the time block. */
    endTime: number
  }
  /** Total work time (in minutes) calculated from work intervals. */
  totalWorkTime: number
  /** Ids of actions that can be performed at given session */
  availableActionIds: SessionAction[]
}

export interface SessionWithTaskDTO extends SessionDTO {
  /** Title of the associated task for task sessions. */
  taskTitle?: string

  /** Total work time (in minutes) calculated from work intervals. */
  totalWorkTime: number
}

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
   * @param timeTrackingService - Service to manage time tracking sessions.
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

/**
 * Use case for fetching list items.
 * Combines session data with task title and computed total work time.
 */
export class FindAllSessionListItemsUseCase {
  /**
   * Creates an instance of FindAllSessionListItemsUseCase.
   * @param sessionRepository - Repository to access session data.
   * @param timeTrackingService - Service to manage time tracking sessions.
   */
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly timeTrackingService: TimeTrackingService
  ) {}

  /**
   * Executes the use case to fetch session list items.
   * @returns A promise that resolves to a Result object containing either the session details on success,
   * or an error message on failure.
   */
  async execute(): Promise<Result<SessionWithTaskDTO[]>> {
    try {
      const sessions = await this.sessionRepository.findAllWithTasks()

      const sessionListItems = sessions.map((session) => {
        return {
          ...session,
          totalWorkTime: this.timeTrackingService.getTotalWorkTime(session),
        }
      })

      return {
        success: true,
        value: sessionListItems,
      }
    } catch (error) {
      console.error('Failed to fetch session list items:', error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

/**
 * Use case for fetching detailed information about a specific session.
 * Combines session data with task title, time block details, and computed total work time.
 */
export class FetchSessionDetailsUseCase {
  /**
   * Creates an instance of FetchSessionDetailsUseCase.
   * @param sessionRepository - Repository to access session data.
   * @param taskRepository - Repository to access task data.
   * @param timeBlockRepository - Repository to find time blocks by task ID.
   * @param timeTrackingService - Service to manage time tracking sessions.
   * @param userActionsService - Service to get session actions.
   */
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly taskRepository: TaskRepository,
    private readonly timeBlockRepository: TimeBlockRepository,
    private readonly timeTrackingService: TimeTrackingService,
    private readonly userActionsService: UserActionsService
  ) {}

  /**
   * Executes the use case to fetch session details.
   * @param sessionId - Unique identifier of the session to retrieve. If there is no identifier,
   * then active session is fetched
   * @returns A promise that resolves to a Result object containing either the session details on success,
   * or an error message on failure.
   */
  async execute(sessionId?: string): Promise<Result<SessionDetails>> {
    try {
      let session

      if (sessionId) session = await this.sessionRepository.findById(sessionId)
      else {
        session = await this.sessionRepository.findActive()
      }

      if (!session)
        return {
          success: false,
          error: 'Failed to find session with id: ' + sessionId,
        }

      let taskTitle

      if (session.taskId) {
        const task = await this.taskRepository.findById(session.taskId)

        if (task) taskTitle = task.title
      }

      let timeBlockInterval

      if (session.timeBlockId) {
        const timeBlock = await this.timeBlockRepository.findById(session.timeBlockId)

        if (timeBlock)
          timeBlockInterval = {
            startTime: timeBlock.startTime,
            endTime: timeBlock.endTime,
          }
      }

      const sessionDetails = {
        taskTitle,
        timeBlock: timeBlockInterval,
        totalWorkTime: this.timeTrackingService.getTotalWorkTime(session),
        availableActionIds: this.userActionsService.getSessionActions(session),
        ...session,
      }

      return {
        success: true,
        value: sessionDetails,
      }
    } catch (error) {
      console.error('Failed to fetch session details:', error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
