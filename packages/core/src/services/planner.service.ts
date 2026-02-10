import { TimeBlockEntity } from '../entities/time-block.entity.js'
import { IdGenerator, TimeBlockRepository } from '../ports/repository.port.js'

const oneHour = 60 * 60 * 1000
const oneDay = 24 * oneHour
const oneMonth = 30 * oneDay

export class PlannerService {
  constructor(
    private readonly timeBlockRepository: TimeBlockRepository,
    private readonly idGenerator: IdGenerator
  ) {}

  async schedule(taskId: string, startTime: Date, endTime: Date): Promise<boolean> {
    if (!this.isFutureTimeBlock(startTime, endTime) || !this.isSonnerThanMonth) return false

    const desiredTimeBlock = TimeBlockEntity.create(this.idGenerator, {
      taskId,
      startTime,
      endTime,
    })

    const busyTimeBlocks = await this.findClosestTimeBlocks(startTime, endTime)

    for (const currTimeBlockDate of busyTimeBlocks) {
      const busyTimeBlock = TimeBlockEntity.restore(currTimeBlockDate)

      if (desiredTimeBlock.overlaps(busyTimeBlock)) return false
    }

    await this.timeBlockRepository.save(desiredTimeBlock.toData())

    return true
  }

  async getBusyTimeBlocks(day: Date) {
    const startFrom = new Date(day)

    if (day.getDate() === new Date().getDate()) {
      startFrom.setHours(new Date().getHours())
      startFrom.setMinutes(new Date().getMinutes())
    } else {
      startFrom.setHours(0)
      startFrom.setMinutes(0)
    }

    return await this.timeBlockRepository.findAllWithin(
      startFrom.getTime(),
      startFrom.getTime() + oneDay
    )
  }

  async findClosestTimeBlocks(startTime: Date, endTime: Date) {
    const maxMsInTimeBlock = TimeBlockEntity.maxTimeBlockHours * oneHour

    const left = new Date(startTime.getTime() - maxMsInTimeBlock)
    const right = new Date(endTime.getTime() + maxMsInTimeBlock)

    return await this.timeBlockRepository.findAllWithin(left.getTime(), right.getTime())
  }

  private isFutureTimeBlock(startTime: Date, endTime: Date) {
    const currTime = new Date()

    return currTime <= startTime && currTime < endTime
  }

  private isSonnerThanMonth(endTime: Date) {
    const currTime = new Date()

    const monthAhead = new Date(currTime.getTime() + oneMonth)

    return endTime <= monthAhead
  }
}
