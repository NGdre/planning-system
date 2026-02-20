import {
  CreateTaskInput,
  CreateTaskUseCase,
  GetSpecificTaskUseCase,
  ListTasksUseCase,
  PlannerService,
  Result,
  ScheduleTimeBlockForTask,
  TaskDetails as CoreTaskDetails,
  UserActionsService,
  VoidResult,
} from '@planning-system/core'
import { ru } from 'date-fns/locale'
import { isSameDay } from 'date-fns'
import { fromZonedTime, format, formatInTimeZone } from 'date-fns-tz'
import { v4 as uuid } from 'uuid'
import { parseDay } from './parsing/parse-day.js'
import { parseTimeInZone } from './parsing/parse-time-in-zone.js'
import { DatabaseConnection } from './persistence/db.js'
import { KnexTaskRepository } from './persistence/repositories/task.repo.js'
import { KnexTimeBlockRepository } from './persistence/repositories/time-block.repo.js'

export type TaskDetails = CoreTaskDetails & { timeBlock?: string; day?: string }

export type DaySlots = { slots: string[]; hasPrevDay: boolean; hasNextDay: boolean }

export class CLIAdapter {
  private _userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  constructor(
    private readonly taskRepo: KnexTaskRepository,
    private readonly timeBlockRepo: KnexTimeBlockRepository,
    private readonly userActionsService: UserActionsService,
    private readonly plannerService: PlannerService
  ) {}

  set userTimeZone(tz: string) {
    this._userTimeZone = tz
  }

  static async create() {
    const db = await DatabaseConnection.getConnection()
    const taskRepo = new KnexTaskRepository(db)
    const timeBlockRepo = new KnexTimeBlockRepository(db)
    const userActionsService = new UserActionsService()
    const plannerService = new PlannerService(taskRepo, timeBlockRepo, uuid)

    return new CLIAdapter(taskRepo, timeBlockRepo, userActionsService, plannerService)
  }

  async createTask(input: CreateTaskInput) {
    return await new CreateTaskUseCase(this.taskRepo, uuid).execute(input)
  }

  async listTasks() {
    return await new ListTasksUseCase(this.taskRepo).execute()
  }

  async getSpecificTask(id: string): Promise<Result<TaskDetails>> {
    const result = await new GetSpecificTaskUseCase(
      this.taskRepo,
      this.timeBlockRepo,
      this.userActionsService
    ).execute(id)

    if (!result.success) return result

    let timeBlock, day

    if (result.value.startTime && result.value.endTime) {
      timeBlock = this.formatTimeBlock(result.value.startTime, result.value.endTime)

      day = format(result.value.startTime, 'dd MMMM yyyy', {
        locale: ru,
      })
    }

    return {
      success: true,
      value: Object.assign({}, result.value, { timeBlock, day }),
    }
  }

  async schedule(
    taskId: string,
    day: string,
    startTime: string,
    endTime: string
  ): Promise<VoidResult<string>> {
    const parsedDay = this.parseDay(day)

    if (!parsedDay.success) return parsedDay

    const userTimeZone = this._userTimeZone

    const dayUTC = fromZonedTime(parsedDay.value, userTimeZone)

    const createStartTime = parseTimeInZone(startTime, userTimeZone)
    const createEndTime = parseTimeInZone(endTime, userTimeZone)

    if (createStartTime === null || createEndTime === null) {
      return {
        success: false,
        error: 'the time block does not match the format',
      }
    }

    const startTimeUTC = createStartTime(dayUTC)
    const endTimeUTC = createEndTime(dayUTC)

    if (endTimeUTC < startTimeUTC) {
      endTimeUTC.setUTCDate(endTimeUTC.getUTCDate() + 1)
    }

    return await new ScheduleTimeBlockForTask(
      this.plannerService,
      this.taskRepo,
      this.timeBlockRepo
    ).execute(taskId, startTimeUTC, endTimeUTC)
  }

  async showAvailableSlots(day: string): Promise<Result<DaySlots>> {
    const parsedDay = this.parseDay(day)

    if (!parsedDay.success) return parsedDay

    const userTimeZone = this._userTimeZone

    const dayUTC = fromZonedTime(parsedDay.value, userTimeZone)

    const isSameDayValue = isSameDay(parsedDay.value, new Date())
    const from = isSameDayValue ? fromZonedTime(new Date(), this._userTimeZone) : dayUTC
    const to = fromZonedTime(new Date(parsedDay.value).setHours(24), userTimeZone)

    const availableSlots = await this.plannerService.findAvailableSlots(from, to)

    if (!availableSlots.success) return availableSlots

    const formatedSlots = availableSlots.value.map((slot) =>
      this.formatTimeBlock(slot.startTime, slot.endTime)
    )

    return {
      value: {
        slots: formatedSlots,
        hasPrevDay: !isSameDayValue,
        hasNextDay: !this.plannerService.isLastDayToSchedule(dayUTC),
      },
      success: true,
    }
  }

  parseDay(day: string): Result<Date> {
    const parsedDay = parseDay(day)

    if (parsedDay === null)
      return {
        success: false,
        error: 'the day does not match the format',
      }

    return {
      success: true,
      value: parsedDay,
    }
  }

  private formatTimeBlock(startTime: Date, endTime: Date) {
    const formatedStart = formatInTimeZone(startTime, this._userTimeZone, 'HH:mm')
    const formatedEnd = formatInTimeZone(endTime, this._userTimeZone, 'HH:mm')

    return formatedStart + '-' + (formatedEnd === '00:00' ? '24:00' : formatedEnd)
  }
}
