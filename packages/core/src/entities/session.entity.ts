import { IdGenerator } from '../ports/repository.port.js'
import { IntervalDTO, IntervalVO } from '../value-objects/interval.vo.js'
import { Entity } from './Entity.js'

export interface SessionDTO {
  id: string
  taskId: string | null
  timeBlockId: string | null
  startTime: number
  endTime: number | null
  status: 'active' | 'completed'
  intervals: IntervalDTO[]
}

export class SessionEntity extends Entity {
  private _intervals: IntervalVO[] = []

  private constructor(
    public readonly id: string,
    public readonly taskId: string | null,
    public readonly timeBlockId: string | null,
    public readonly startTime: Date,
    intervals: IntervalVO[],
    private _endTime?: Date
  ) {
    if (timeBlockId && !taskId) {
      throw new Error('Planned session must have a taskId')
    }

    super(id)
    this._intervals = intervals
  }

  static create(
    idGenerator: IdGenerator,
    params: { taskId: string | null; timeBlockId: string | null }
  ) {
    const { taskId = null, timeBlockId = null } = params

    return new SessionEntity(idGenerator(), taskId, timeBlockId, new Date(), [
      new IntervalVO('work', new Date()),
    ])
  }

  static restore(dto: SessionDTO): SessionEntity {
    const intervals = dto.intervals.map((dtoInterval) => IntervalVO.restore(dtoInterval))

    return new SessionEntity(
      dto.id,
      dto.taskId,
      dto.timeBlockId,
      new Date(dto.startTime),
      intervals,
      dto.endTime ? new Date(dto.endTime) : undefined
    )
  }

  toData(): SessionDTO {
    return {
      id: this.id,
      taskId: this.taskId,
      timeBlockId: this.timeBlockId,
      startTime: this.startTime.getTime(),
      endTime: this._endTime?.getTime() ?? null,
      status: this.status,
      intervals: this._intervals.map((i) => i.toData(this.id)),
    }
  }

  get intervals(): ReadonlyArray<IntervalVO> {
    return this._intervals
  }

  get status(): 'active' | 'completed' {
    return this._endTime ? 'completed' : 'active'
  }

  /**
   * Checks if the session can be paused.
   * @returns True if last interval is break type, otherwise false.
   */
  canPause(): boolean {
    const last = this.currentInterval()

    return last?.type === 'work'
  }

  /**
   * Checks if the session can be resumed.
   * @returns True if last interval is work type, otherwise false.
   */
  canResume(): boolean {
    const last = this.currentInterval()

    return last?.type === 'break'
  }

  /**
   * Checks if the session can be stopped.
   * @returns True if session is active, otherwise false.
   */
  canStop(): boolean {
    return this.status === 'active'
  }

  pause(): void {
    this.assertActive()
    const last = this.currentInterval()
    if (!last || last.type !== 'work') throw new Error('Cannot pause: not in work')
    last.endTime = new Date()
    this._intervals.push(new IntervalVO('break', new Date()))
  }

  resume(): void {
    this.assertActive()
    const last = this.currentInterval()
    if (!last || last.type !== 'break') throw new Error('Cannot resume: not in break')
    last.endTime = new Date()
    this._intervals.push(new IntervalVO('work', new Date()))
  }

  stop(): void {
    this.assertActive()
    const last = this.currentInterval()
    if (last) {
      last.endTime = new Date()
    }
    this._endTime = new Date()
  }

  private currentInterval(): IntervalVO | undefined {
    return this._intervals.find((i) => i.isActive())
  }

  private assertActive(): void {
    if (this.status !== 'active') throw new Error('Session is already completed')
  }
}
