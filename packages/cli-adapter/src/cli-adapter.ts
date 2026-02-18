import {
  CreateTaskInput,
  CreateTaskUseCase,
  GetSpecificTaskUseCase,
  ListTasksUseCase,
  PlannerService,
  Result,
  ScheduleTimeBlockForTask,
  ShowAvailableSlotsForDayUseCase,
  TaskDetails as CoreTaskDetails,
  UserActionsService,
  VoidResult,
} from '@planning-system/core'
import { ru } from 'date-fns/locale'
import { format } from 'date-fns'
import { fromZonedTime } from 'date-fns-tz'
import { v4 as uuid } from 'uuid'
import { parseDay } from './parsing/parse-day.js'
import { parseTimeInZone } from './parsing/parse-time-in-zone.js'
import { DatabaseConnection } from './persistence/db.js'
import { KnexTaskRepository } from './persistence/repositories/task.repo.js'
import { KnexTimeBlockRepository } from './persistence/repositories/time-block.repo.js'

export type TaskDetails = CoreTaskDetails & { timeBlock?: string; day?: string }

export class CLIAdapter {
  private userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  constructor(
    private readonly taskRepo: KnexTaskRepository,
    private readonly timeBlockRepo: KnexTimeBlockRepository,
    private readonly userActionsService: UserActionsService,
    private readonly plannerService: PlannerService
  ) {}

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

    const userTimeZone = this.userTimeZone

    const createStartTime = parseTimeInZone(startTime, userTimeZone)
    const createEndTime = parseTimeInZone(endTime, userTimeZone)

    if (createStartTime === null || createEndTime === null) {
      return {
        success: false,
        error: 'the time block does not match the format',
      }
    }

    return await new ScheduleTimeBlockForTask(this.plannerService).execute(
      taskId,
      createStartTime(parsedDay.value),
      createEndTime(parsedDay.value)
    )
  }

  async showAvailableSlots(day: string) {
    const parsedDay = this.parseDay(day)

    if (!parsedDay.success) return parsedDay

    return await new ShowAvailableSlotsForDayUseCase(this.plannerService).execute(
      parsedDay.value,
      fromZonedTime(new Date(), this.userTimeZone)
    )
  }

  parseDay(day: string): Result<Date> {
    const parsedDay = parseDay(day)

    if (parsedDay === null)
      return {
        success: false,
        error: 'the day does not match the format',
      }

    const userTimeZone = this.userTimeZone

    return {
      success: true,
      value: fromZonedTime(parsedDay, userTimeZone),
    }
  }

  private formatTimeBlock(startTime: Date, endTime: Date) {
    return format(startTime, 'HH:mm') + '-' + format(endTime, 'HH:mm')
  }
}
