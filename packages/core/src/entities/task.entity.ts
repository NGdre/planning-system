import { IdGenerator } from '../ports/repository.port'
import { TimeBlock, TimeBlockVO } from '../value-objects/time-block.vo'
import { Entity } from './Entity'

type TaskStatus = 'draft' | 'scheduled' | 'in_progress' | 'canceled'

export interface BaseTask {
  title: string
  status: TaskStatus
}

export interface ScheduledData {
  scheduledTimeBlock: TimeBlock
}

export type Task = BaseTask & ({ status: 'draft' } | ({ status: 'scheduled' } & ScheduledData))

export type TaskDTO = {
  id: string
  title: string
  status: TaskStatus
  scheduledTimeBlock?: {
    startTime: string
    endTime: string
  }
}

export class TaskEntity extends Entity implements BaseTask {
  private _title: string
  private _status: TaskStatus = 'draft'
  private _scheduledTimeBlock: TimeBlockVO | undefined

  private constructor(params: {
    id: string
    title: string
    status?: TaskStatus
    scheduledTimeBlock?: TaskDTO['scheduledTimeBlock']
  }) {
    super(params.id)
    this._title = params.title
    if (params.status) this._status = params.status
    if (params.scheduledTimeBlock)
      this._scheduledTimeBlock = TimeBlockVO.createFromISOStrings(params.scheduledTimeBlock)
  }

  get title() {
    return this._title
  }

  get status() {
    return this._status
  }

  get scheduledTimeBlock() {
    return this._scheduledTimeBlock
  }

  schedule(timeBlock: TimeBlock) {
    this._scheduledTimeBlock = new TimeBlockVO(timeBlock.startTime, timeBlock.endTime)
    this._status = 'scheduled'
  }

  static create(idGenerator: IdGenerator, params: { title: string }) {
    return new TaskEntity({
      id: idGenerator(),
      ...params,
    })
  }

  static restore(persistedData: TaskDTO) {
    return new TaskEntity(persistedData)
  }

  toData(): TaskDTO {
    return Object.assign(
      {
        id: this.id,
        status: this.status,
        title: this.title,
      },
      this.scheduledTimeBlock && { scheduledTimeBlock: this.scheduledTimeBlock?.toData() }
    )
  }
}
