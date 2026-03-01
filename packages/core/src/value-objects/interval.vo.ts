import { ValueObject } from './ValueObject.js'

export type IntervalType = 'work' | 'break'

export interface IntervalDTO {
  sessionId: string
  type: 'work' | 'break'
  startTime: number
  endTime: number | null
}

export class IntervalVO extends ValueObject {
  constructor(
    public readonly type: IntervalType,
    public readonly startTime: Date,
    public endTime?: Date
  ) {
    super()

    if (endTime && endTime <= startTime) {
      throw new Error('End time must be after start time')
    }
  }

  static restore(dto: IntervalDTO): IntervalVO {
    return new IntervalVO(
      dto.type,
      new Date(dto.startTime),
      dto.endTime ? new Date(dto.endTime) : undefined
    )
  }

  toData(sessionId: string): IntervalDTO {
    return {
      sessionId,
      type: this.type,
      startTime: this.startTime.getTime(),
      endTime: this.endTime?.getTime() ?? null,
    }
  }

  isActive(): boolean {
    return this.endTime === undefined
  }

  protected valuesEqual(other: IntervalVO): boolean {
    return (
      this.type === other.type &&
      this.startTime.getTime() === other.startTime.getTime() &&
      this.endTime?.getTime() === other.endTime?.getTime()
    )
  }
}
