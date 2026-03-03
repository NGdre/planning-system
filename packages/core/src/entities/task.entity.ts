import { IdGenerator } from '../ports/repository.port.js'
import { Entity } from './Entity.js'

type TaskStatus = 'draft' | 'scheduled' | 'in_progress' | 'canceled' | 'completed'

export interface BaseTask {
  title: string
  status: TaskStatus
}

export type TaskDTO = {
  id: string
  title: string
  status: TaskStatus
}

/**
 * Represents a Task domain entity.
 * Encapsulates task state and business rules for state transitions.
 * Extends the base Entity class.
 */
export class TaskEntity extends Entity implements BaseTask {
  private _title: string
  private _status: TaskStatus = 'draft'

  /**
   * Private constructor to enforce creation via static methods.
   * @param params - Object containing id, title, and optional status.
   */
  private constructor(params: { id: string; title: string; status?: TaskStatus }) {
    super(params.id)
    this._title = params.title
    if (params.status) this._status = params.status
  }

  /** Gets the task title. */
  get title() {
    return this._title
  }

  /** Gets the current task status. */
  get status() {
    return this._status
  }

  /**
   * Transitions the task status to 'scheduled'.
   * @throws {Error} If the task cannot be scheduled based on current status.
   */
  schedule() {
    if (!this.canSchedule()) throw new Error('can not schedule task')
    this._status = 'scheduled'
  }

  /**
   * Transitions the task status to 'in_progress'.
   * @throws {Error} If the task cannot be started based on current status.
   */
  start() {
    if (!this.canStart()) throw new Error('can not start task')
    this._status = 'in_progress'
  }

  /**
   * Checks if the task can be scheduled.
   * @returns True if status is 'draft' or 'scheduled', otherwise false.
   */
  canSchedule(): boolean {
    return ['draft', 'scheduled'].includes(this.status)
  }

  /**
   * Checks if the task can be started.
   * @returns True if status is 'draft' or 'scheduled', otherwise false.
   */
  canStart(): boolean {
    return ['draft', 'scheduled'].includes(this.status)
  }

  /**
   * Checks if the task can be edited.
   * @returns True if status is not 'canceled' or 'completed', otherwise false.
   */
  canEdit(): boolean {
    return !['canceled', 'completed'].includes(this.status)
  }

  /**
   * Checks if the task can be completed.
   * @returns True if status is 'draft' or 'in_progress', otherwise false.
   */
  canComplete(): boolean {
    return !['scheduled', 'canceled', 'completed'].includes(this.status)
  }

  /**
   * Checks if the task can be deleted.
   * @returns True if status is 'draft', otherwise false.
   */
  canDelete(): boolean {
    return this.status === 'draft'
  }

  /**
   * Checks if the task can be canceled.
   * @returns True if status is 'scheduled' or 'in_progress', otherwise false.
   */
  canCancel(): boolean {
    return ['scheduled', 'in_progress'].includes(this.status)
  }

  /**
   * Creates a new TaskEntity with a generated ID and default 'draft' status.
   * @param idGenerator - A function that generates a unique ID.
   * @param params - Object containing the task title.
   * @returns A new TaskEntity instance.
   */
  static create(idGenerator: IdGenerator, params: { title: string }): TaskEntity {
    return new TaskEntity({
      id: idGenerator(),
      ...params,
    })
  }

  /**
   * Restores a TaskEntity from persisted data (e.g., from a database).
   * @param persistedData - The DTO containing task data.
   * @returns A TaskEntity instance with the given state.
   */
  static restore(persistedData: TaskDTO): TaskEntity {
    return new TaskEntity(persistedData)
  }

  /**
   * Converts the current task entity to a data transfer object (DTO) for persistence.
   * @returns A plain object representing the task.
   */
  toData(): TaskDTO {
    return {
      id: this.id,
      status: this.status,
      title: this.title,
    }
  }
}
