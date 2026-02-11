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

    if (await this.hasOverlappingTimeBlocks(startTime, endTime)) return false

    const desiredTimeBlock = TimeBlockEntity.create(this.idGenerator, {
      taskId,
      startTime,
      endTime,
    })

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

  /**
   * Checks all potential overlapping time blocks with given one
   *
   * @param startTime - Start of given time block
   * @param endTime - End of given time block
   * @param excludeId - Excludes id of time block. It is useful when there's
   * a time block in repository that have to be rescheduled
   * @returns true if there's overlapping time blocks, false otherwise
   */
  private async hasOverlappingTimeBlocks(
    startTime: Date,
    endTime: Date,
    excludeId?: string
  ): Promise<boolean> {
    const nearbyBlocks = await this.findClosestTimeBlocks(startTime, endTime)

    const desiredBlock = { startTime, endTime }

    for (const blockData of nearbyBlocks) {
      if (excludeId && blockData.id === excludeId) {
        continue
      }

      const busyBlock = TimeBlockEntity.restore(blockData)
      if (busyBlock.overlaps(desiredBlock)) {
        return true
      }
    }

    return false
  }
}
