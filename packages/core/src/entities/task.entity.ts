import { IdGenerator } from '../ports/repository.port.js'
import { TimeBlock, TimeBlockVO } from '../value-objects/time-block.vo.js'
import { Entity } from './Entity.js'

type TaskStatus = 'draft' | 'scheduled' | 'in_progress' | 'canceled' | 'completed'

export interface BaseTask {
  title: string
  status: TaskStatus
}

export interface ScheduledData {
  scheduledTimeBlock: TimeBlock
}

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

  canSchedule() {
    if (['draft', 'scheduled'].includes(this.status)) return true
    return false
  }

  canStart() {
    if (this.status === 'scheduled') return true
    return false
  }

  canEdit() {
    if (!['canceled', 'completed'].includes(this.status)) return true
    return false
  }

  canComplete() {
    if (!['scheduled', 'canceled', 'completed'].includes(this.status)) return true
    return false
  }

  canDelete() {
    if (this.status === 'draft') return true
    return false
  }

  canCancel() {
    if (['scheduled', 'in_progress'].includes(this.status)) return true
    return false
  }

  schedule(timeBlock: TimeBlock) {
    if (this.canSchedule()) {
      this._scheduledTimeBlock = new TimeBlockVO(timeBlock.startTime, timeBlock.endTime)
      this._status = 'scheduled'
    }
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
