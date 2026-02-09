import { IdGenerator } from '../ports/repository.port.js'
import { Entity } from './Entity.js'

export interface TimeBlock {
  startTime: Date
  endTime: Date
}

export interface TimeBlockDTO {
  id: string
  taskId: string
  startTime: number
  endTime: number
  createdAt: number
  rescheduledTimes: number
}

export class TimeBlockEntity extends Entity implements TimeBlock {
  private _startTime: Date
  private _endTime: Date
  private _createdAt: Date
  private _taskId: string
  private _rescheduledTimes: number

  private constructor(params: {
    id: string
    taskId: string
    startTime: Date
    endTime: Date
    createdAt: Date
    rescheduledTimes: number
  }) {
    super(params.id)

    this._taskId = params.taskId
    this._startTime = TimeBlockEntity.roundToMinute(params.startTime)
    this._endTime = TimeBlockEntity.roundToMinute(params.endTime)
    this._createdAt = params.createdAt
    this._rescheduledTimes = params.rescheduledTimes
    this.validate()
  }

  get startTime() {
    return new Date(this._startTime)
  }

  get endTime() {
    return new Date(this._endTime)
  }

  get taskId() {
    return this._taskId
  }

  get rescheduledTimes() {
    return this._rescheduledTimes
  }

  static create(
    idGenerator: IdGenerator,
    params: { taskId: string; startTime: Date; endTime: Date }
  ) {
    return new TimeBlockEntity({
      id: idGenerator(),
      rescheduledTimes: 0,
      createdAt: new Date(),
      ...params,
    })
  }

  static restore(persistedData: TimeBlockDTO) {
    return new TimeBlockEntity({
      ...persistedData,
      createdAt: new Date(persistedData.createdAt),
      startTime: new Date(persistedData.startTime),
      endTime: new Date(persistedData.endTime),
    })
  }

  private static roundToMinute(date: Date): Date {
    const roundedDate = new Date(date)
    roundedDate.setSeconds(0, 0)
    return roundedDate
  }

  toData(): TimeBlockDTO {
    return {
      id: this.id,
      taskId: this._taskId,
      rescheduledTimes: this._rescheduledTimes,
      startTime: this.startTime.getTime(),
      endTime: this.endTime.getTime(),
      createdAt: this._createdAt.getTime(),
    }
  }

  private validate() {
    if (this.startTime >= this.endTime) {
      throw new Error('Start time must be before end time')
    }

    if (this.durationInMinutes < 15) {
      throw new Error('Time block must be at least 15 minutes')
    }

    if (this.durationInHours > 16) {
      throw new Error('Time block cannot exceed 16 hours')
    }
  }

  get durationInMinutes() {
    return Math.floor((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60))
  }

  get durationInHours() {
    return this.durationInMinutes / 60
  }

  overlaps(other: TimeBlock) {
    return this.startTime < other.endTime && this.endTime > other.startTime
  }

  contains(other: TimeBlock) {
    return this.startTime <= other.startTime && this.endTime >= other.endTime
  }

  reschedule(newStartTime: Date, newEndTime: Date) {
    const previousStartTime = this._startTime
    const previousEndTime = this._endTime

    this._startTime = TimeBlockEntity.roundToMinute(newStartTime)
    this._endTime = TimeBlockEntity.roundToMinute(newEndTime)

    try {
      this.validate()
      this._rescheduledTimes++
    } catch (error) {
      this._startTime = previousStartTime
      this._endTime = previousEndTime
      throw error
    }
  }
}
