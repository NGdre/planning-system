import { TimeBlockEntity } from '../entities/time-block.entity.js'
import { IdGenerator, TimeBlockRepository } from '../ports/repository.port.js'
import { VoidResult } from '../types.js'

const oneHour = 60 * 60 * 1000
const oneDay = 24 * oneHour
const oneMonth = 30 * oneDay

export class PlannerService {
  constructor(
    private readonly timeBlockRepository: TimeBlockRepository,
    private readonly idGenerator: IdGenerator
  ) {}

  /**
   * Schedules time block for given task of given time range
   *
   * @param taskId - The id of the task for which time block is created
   * @param startTime - The time at which time block should start
   * @param endTime - The time at which time block should end
   * @returns VoidResult
   */
  async schedule(taskId: string, startTime: Date, endTime: Date): Promise<VoidResult> {
    if (!this.isFutureTimeBlock(startTime, endTime))
      return {
        success: false,
        error: 'time blocks can only be scheduled in future',
      }

    if (!this.isSonnerThanMonth(endTime))
      return {
        success: false,
        error: 'time blocks can only be scheduled for 30 days ahead at most',
      }

    const hasOverlap = await this.hasOverlappingTimeBlocks(startTime, endTime)

    if (hasOverlap) {
      return {
        success: false,
        error: 'New time block overlaps with existing blocks',
      }
    }

    try {
      const nonExistentTimeBlock = await this.timeBlockRepository.findByTaskId(taskId)

      if (nonExistentTimeBlock !== null)
        throw new Error('can not create more than one time block for the task')

      const desiredTimeBlock = TimeBlockEntity.create(this.idGenerator, {
        taskId,
        startTime,
        endTime,
      })

      await this.timeBlockRepository.save(desiredTimeBlock.toData())

      return { success: true, value: undefined }
    } catch (error) {
      console.error('Failed to schedule time block:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Reschedules existing time block
   *
   * @param timeBlockId - id of time block that needs to be rescheduled
   * @param newStartTime - New start time for existing time block
   * @param newEndTime - New end time for existing time block
   * @returns VoidResult
   */
  async rescheduleTimeBlock(
    timeBlockId: string,
    newStartTime: Date,
    newEndTime: Date
  ): Promise<VoidResult> {
    const existingData = await this.timeBlockRepository.findById(timeBlockId)

    if (!existingData) {
      return {
        success: false,
        error: 'Time block not found',
      }
    }

    if (!this.isFutureTimeBlock(newStartTime, newEndTime))
      return {
        success: false,
        error: 'time blocks can only be scheduled in future',
      }

    if (!this.isSonnerThanMonth(newEndTime))
      return {
        success: false,
        error: 'time blocks can only be scheduled for 30 days ahead at most',
      }

    const hasOverlap = await this.hasOverlappingTimeBlocks(newStartTime, newEndTime, timeBlockId)

    if (hasOverlap) {
      return {
        success: false,
        error: 'New time overlaps with existing blocks',
      }
    }

    try {
      const timeBlock = TimeBlockEntity.restore(existingData)
      timeBlock.reschedule(newStartTime, newEndTime)

      await this.timeBlockRepository.save(timeBlock.toData())

      return { success: true, value: undefined }
    } catch (error) {
      console.error('Failed to reschedule time block:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
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
