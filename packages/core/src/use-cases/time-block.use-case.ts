import { TimeBlock } from '../entities/time-block.entity.js'
import { PlannerService } from '../services/planner.service.js'
import { Result } from '../types.js'

export type DaySlots = { slots: TimeBlock[]; hasPrevDay: boolean; hasNextDay: boolean }

export class ShowAvailableSlotsForDayUseCase {
  constructor(private readonly plannerService: PlannerService) {}

  async execute(day: string): Promise<Result<DaySlots>> {
    const parsedDay = new Date(Date.parse(day))

    const isSameDay = new Date().toISOString().slice(0, 10) === parsedDay.toISOString().slice(0, 10)

    const from = isSameDay ? new Date() : parsedDay
    const to = new Date(new Date(day).setHours(24))

    const availableSlots = await this.plannerService.findAvailableSlots(from, to)

    if (availableSlots.success) {
      return {
        value: {
          slots: availableSlots.value,
          hasPrevDay: !isSameDay,
          hasNextDay: !this.plannerService.isLastDayToSchedule(parsedDay),
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

  async execute(taskId: string, startTime: string, endTime: string) {
    const parsedStart = new Date(startTime)
    const parsedEnd = new Date(endTime)

    return await this.plannerService.schedule(taskId, parsedStart, parsedEnd)
  }
}
