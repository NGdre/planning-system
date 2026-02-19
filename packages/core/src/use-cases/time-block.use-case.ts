import { TimeBlock } from '../entities/time-block.entity.js'
import { PlannerService } from '../services/planner.service.js'
import { Result } from '../types.js'

export type DaySlots = { slots: TimeBlock[]; hasPrevDay: boolean; hasNextDay: boolean }

export class ShowAvailableSlotsForDayUseCase {
  constructor(private readonly plannerService: PlannerService) {}

  async execute(
    day: Date,
    now: Date,
    endOfDay?: Date,
    isSameDayParam?: boolean
  ): Promise<Result<DaySlots>> {
    const isSameDay = isSameDayParam

    const from = isSameDay ? now : day
    const to = endOfDay || new Date(new Date(day).setUTCHours(24))

    const availableSlots = await this.plannerService.findAvailableSlots(from, to)

    if (availableSlots.success) {
      return {
        value: {
          slots: availableSlots.value,
          hasPrevDay: !isSameDay,
          hasNextDay: !this.plannerService.isLastDayToSchedule(day),
        },
        success: true,
      }
    } else {
      return availableSlots
    }
  }
}

export class ScheduleTimeBlockForTask {
  constructor(private readonly plannerService: PlannerService) {}

  async execute(taskId: string, startTime: Date, endTime: Date) {
    return await this.plannerService.schedule(taskId, startTime, endTime)
  }
}
