import { TaskEntity } from '../entities/task.entity.js'
import { TimeBlock, TimeBlockEntity } from '../entities/time-block.entity.js'
import { IdGenerator, TaskRepository, TimeBlockRepository } from '../ports/repository.port.js'
import { Result, VoidResult } from '../types.js'

const oneHour = 60 * 60 * 1000
const oneDay = 24 * oneHour
const oneMonth = 30 * oneDay

export class PlannerService {
  constructor(
    private readonly taskRepository: TaskRepository,
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
    const validationResult = this.validateTimeRange(startTime, endTime)

    if (!validationResult.success) {
      return validationResult
    }

    const hasOverlap = await this.hasOverlappingTimeBlocks(startTime, endTime)

    if (hasOverlap) {
      return {
        success: false,
        error: 'Time block overlaps with existing blocks',
      }
    }

    try {
      const task = await this.taskRepository.findById(taskId)

      if (!task) return { success: false, error: 'Task is not found when scheduling' }

      const taskEntity = TaskEntity.restore(task)

      taskEntity.schedule()

      const desiredTimeBlock = TimeBlockEntity.create(this.idGenerator, {
        taskId,
        startTime,
        endTime,
      })

      // TODO: unsafe, add transaction
      await this.taskRepository.save(taskEntity.toData())
      await this.timeBlockRepository.save(desiredTimeBlock.toData())

      return { success: true }
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
        error: 'Time block is not found',
      }
    }

    const validationResult = this.validateTimeRange(newStartTime, newEndTime)

    if (!validationResult.success) {
      return validationResult
    }

    const hasOverlap = await this.hasOverlappingTimeBlocks(newStartTime, newEndTime, timeBlockId)

    if (hasOverlap) {
      return {
        success: false,
        error: 'Time block overlaps with existing blocks',
      }
    }

    try {
      const timeBlock = TimeBlockEntity.restore(existingData)
      timeBlock.reschedule(newStartTime, newEndTime)

      await this.timeBlockRepository.save(timeBlock.toData())

      return { success: true }
    } catch (error) {
      console.error('Failed to reschedule time block:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Finds available slots for a given date range
   *
   * @param from - A date at which available slots to search from
   * @param day -  A date at which available slots to search to
   * @returns free slots longer than 15 minutes in one day
   */
  async findAvailableSlots(from: Date, to: Date): Promise<Result<TimeBlock[]>> {
    let busySlots

    try {
      const timeBlocksData = await this.timeBlockRepository.findAllWithin(
        from.getTime(),
        to.getTime()
      )

      busySlots = timeBlocksData.map((data) => TimeBlockEntity.restore(data))
    } catch (error) {
      console.error(`Failed to find time blocks from date ${from} to date ${to}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    const availableSlots: TimeBlock[] = []

    // busy slots are already sorted in database, but for reliability we do it again
    const sortedBusySlots = busySlots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

    let currentStart =
      from.getTime() === sortedBusySlots[0]?.startTime.getTime() ? sortedBusySlots[0].endTime : from

    for (const busySlot of sortedBusySlots) {
      const gap = busySlot.startTime.getTime() - currentStart.getTime()
      const gapMinutes = gap / (1000 * 60)

      if (gapMinutes >= TimeBlockEntity.minTimeBlockMinutes) {
        availableSlots.push({
          startTime: new Date(currentStart),
          endTime: new Date(busySlot.startTime),
        })
      }
      currentStart = new Date(busySlot.endTime.getTime())
    }

    const remainingTime = to.getTime() - currentStart.getTime()

    if (remainingTime / (1000 * 60) >= TimeBlockEntity.minTimeBlockMinutes) {
      availableSlots.push({
        startTime: new Date(currentStart),
        endTime: new Date(to),
      })
    }

    return {
      success: true,
      value: availableSlots,
    }
  }

  isLastDayToSchedule(day: Date) {
    return !this.isSoonerThanMonth(new Date(new Date(day).setHours(24)))
  }

  private async findClosestTimeBlocks(startTime: Date, endTime: Date) {
    const maxMsInTimeBlock = TimeBlockEntity.maxTimeBlockHours * oneHour

    const left = new Date(startTime.getTime() - maxMsInTimeBlock)
    const right = new Date(endTime.getTime() + maxMsInTimeBlock)

    return await this.timeBlockRepository.findAllWithin(left.getTime(), right.getTime())
  }

  private getDayBoundaries(day: Date): { startOfDay: Date; endOfDay: Date } {
    const startOfDay = new Date(day)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(day)
    endOfDay.setHours(23, 59, 59, 999)

    return { startOfDay, endOfDay }
  }

  private isFutureTimeBlock(startTime: Date, endTime: Date) {
    const currTime = new Date()

    return currTime <= startTime && currTime < endTime
  }

  private isSoonerThanMonth(endTime: Date) {
    const currTime = new Date()

    const monthAhead = new Date(currTime.getTime() + oneMonth)

    return endTime <= monthAhead
  }

  private validateTimeRange(startTime: Date, endTime: Date): VoidResult {
    if (!this.isFutureTimeBlock(startTime, endTime)) {
      return { success: false, error: 'Time blocks can only be scheduled in future' }
    }

    if (!this.isSoonerThanMonth(endTime)) {
      return {
        success: false,
        error: 'Time blocks can only be scheduled for 30 days ahead at most',
      }
    }

    return { success: true }
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
