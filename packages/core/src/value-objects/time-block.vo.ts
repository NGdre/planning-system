import { ValueObject } from './ValueObject'

export interface TimeBlock {
  startTime: Date
  endTime: Date
}

export class TimeBlockVO extends ValueObject implements TimeBlock {
  constructor(
    public readonly startTime: Date,
    public readonly endTime: Date
  ) {
    super()
    this.validate()
  }

  valuesEqual(other: TimeBlockVO): boolean {
    return (
      this.startTime.getTime() === other.startTime.getTime() &&
      this.endTime.getTime() === other.endTime.getTime()
    )
  }

  toData() {
    return {
      startTime: this.startTime.toISOString(),
      endTime: this.endTime.toISOString(),
    }
  }

  private validate(): void {
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

  get durationInMinutes(): number {
    return Math.floor((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60))
  }

  get durationInHours(): number {
    return this.durationInMinutes / 60
  }

  overlaps(other: TimeBlock) {
    return this.startTime < other.endTime && this.endTime > other.startTime
  }

  contains(other: TimeBlock) {
    return this.startTime <= other.startTime && this.endTime >= other.endTime
  }

  static createFromISOStrings({ startTime, endTime }: { startTime: string; endTime: string }) {
    return new TimeBlockVO(new Date(startTime), new Date(endTime))
  }
}
