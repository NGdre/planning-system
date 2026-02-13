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

export class TaskEntity extends Entity implements BaseTask {
  private _title: string
  private _status: TaskStatus = 'draft'

  private constructor(params: { id: string; title: string; status?: TaskStatus }) {
    super(params.id)
    this._title = params.title
    if (params.status) this._status = params.status
  }

  get title() {
    return this._title
  }

  get status() {
    return this._status
  }

  schedule() {
    if (!this.canSchedule()) throw new Error('can not schedule task')

    this._status = 'scheduled'
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
    return {
      id: this.id,
      status: this.status,
      title: this.title,
    }
  }
}
