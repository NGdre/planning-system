import {
  TaskDetails as CoreTaskDetails,
  CreateTaskInput,
  CreateTaskUseCase,
  FetchSessionDetailsUseCase,
  FindAllSessionListItemsUseCase,
  FindAllSessionUseCase,
  GetSpecificTaskUseCase,
  ListTasksUseCase,
  PauseSessionUseCase,
  PlannerService,
  Result,
  ResumeSessionUseCase,
  ScheduleTimeBlockForTask,
  SessionDetails,
  StartFreeSessionUseCase,
  StartTaskSessionUseCase,
  StopSessionUseCase,
  TaskService,
  TimeTrackingService,
  UserActionsService,
  VoidResult,
} from '@planning-system/core'
import { differenceInCalendarDays, isSameDay } from 'date-fns'
import { format, formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { ru } from 'date-fns/locale'
import { v4 as uuid } from 'uuid'
import { parseDay } from './parsing/parse-day.js'
import { parseTimeInZone } from './parsing/parse-time-in-zone.js'
import { DatabaseConnection } from './persistence/db.js'
import { KnexSessionRepository } from './persistence/repositories/session.repo.js'
import { KnexTaskRepository } from './persistence/repositories/task.repo.js'
import { KnexTimeBlockRepository } from './persistence/repositories/time-block.repo.js'

export type TaskDetails = CoreTaskDetails & { timeBlock?: string; day?: string }

export type DaySlots = {
  formatedDay: string
  slots: string[]
  hasPrevDay: boolean
  hasNextDay: boolean
}

export type FormatedSessionDetails = SessionDetails & {
  formated: {
    startTime: string
    endTime: string | null
    timeBlock: string | null
    intervals: string[]
    lastWorkIntervalStart: string
  }
}

export type SessionListItem = {
  id: string
  startTime: string
  endTime: string | null
  taskTitle?: string
  totalWorkTime: number
}

export class CLIAdapter {
  private _userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  constructor(
    private readonly taskRepo: KnexTaskRepository,
    private readonly timeBlockRepo: KnexTimeBlockRepository,
    private readonly sessionRepo: KnexSessionRepository,
    private readonly userActionsService: UserActionsService,
    private readonly plannerService: PlannerService,
    private readonly timeTrackingService: TimeTrackingService,
    private readonly taskService: TaskService
  ) {}

  set userTimeZone(tz: string) {
    this._userTimeZone = tz
  }

  static async create() {
    const db = await DatabaseConnection.getConnection()
    const taskRepo = new KnexTaskRepository(db)
    const timeBlockRepo = new KnexTimeBlockRepository(db)
    const sessionRepo = new KnexSessionRepository(db)
    const userActionsService = new UserActionsService()
    const plannerService = new PlannerService(taskRepo, timeBlockRepo, uuid)
    const timeTrackingService = new TimeTrackingService(sessionRepo, uuid)
    const taskService = new TaskService(taskRepo)

    return new CLIAdapter(
      taskRepo,
      timeBlockRepo,
      sessionRepo,
      userActionsService,
      plannerService,
      timeTrackingService,
      taskService
    )
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
        formatedDay: format(parsedDay.value, 'dd.MM.yy'),
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

  parseDayToRelative(day: string): Result<number> {
    const parsedDay = this.parseDay(day)

    if (!parsedDay.success) return parsedDay

    return {
      success: true,
      value: differenceInCalendarDays(parsedDay.value, new Date()),
    }
  }

  startTaskSession(taskId: string) {
    return new StartTaskSessionUseCase(
      this.timeBlockRepo,
      this.taskService,
      this.timeTrackingService
    ).execute(taskId)
  }

  startFreeSession() {
    return new StartFreeSessionUseCase(this.timeTrackingService).execute()
  }

  pauseSession() {
    return new PauseSessionUseCase(this.timeTrackingService).execute()
  }

  resumeSession() {
    return new ResumeSessionUseCase(this.timeTrackingService).execute()
  }

  stopSession() {
    return new StopSessionUseCase(this.timeTrackingService).execute()
  }

  findAllSessions() {
    return new FindAllSessionUseCase(this.timeTrackingService).execute()
  }

  async findAllSessionsListItems(): Promise<Result<SessionListItem[]>> {
    const result = await new FindAllSessionListItemsUseCase(
      this.sessionRepo,
      this.timeTrackingService
    ).execute()

    if (!result.success) return result

    const formatedItems = result.value.map((item) => {
      const { startTime, endTime, totalWorkTime, taskTitle, id } = item

      return {
        id,
        taskTitle,
        totalWorkTime,
        startTime: formatInTimeZone(startTime, this._userTimeZone, 'HH:mm'),
        endTime: endTime ? formatInTimeZone(endTime, this._userTimeZone, 'HH:mm') : null,
      }
    })

    return {
      success: true,
      value: formatedItems,
    }
  }

  async fetchSessionDetails(sessionId?: string): Promise<Result<FormatedSessionDetails>> {
    const result = await new FetchSessionDetailsUseCase(
      this.sessionRepo,
      this.taskRepo,
      this.timeBlockRepo,
      this.timeTrackingService,
      this.userActionsService
    ).execute(sessionId)

    if (!result.success) return result

    const { timeBlock, startTime, endTime, intervals } = result.value

    const formatedIntervals = intervals
      .filter((interval) => interval.type === 'work')
      .map((interval) =>
        this.formatTimeBlock(
          new Date(interval.startTime),
          interval.endTime ? new Date(interval.endTime) : undefined
        )
      )

    // work interval exist if sessionId exist, so start is defined
    const lastWorkInterval = intervals.findLast((interval) => interval.type === 'work')!

    const lastWorkIntervalStart = formatInTimeZone(
      lastWorkInterval.startTime,
      this._userTimeZone,
      'HH:mm'
    )

    const formated = {
      startTime: formatInTimeZone(startTime, this._userTimeZone, 'HH:mm'),
      endTime: endTime ? formatInTimeZone(endTime, this._userTimeZone, 'HH:mm') : null,
      timeBlock: timeBlock
        ? this.formatTimeBlock(new Date(timeBlock.startTime), new Date(timeBlock.endTime))
        : null,
      intervals: formatedIntervals,
      lastWorkIntervalStart,
    }

    return {
      success: true,
      value: {
        ...result.value,
        formated,
      },
    }
  }

  private formatTimeBlock(startTime: Date, endTime?: Date) {
    const formatedStart = formatInTimeZone(startTime, this._userTimeZone, 'HH:mm')

    if (endTime === undefined) return formatedStart + '-?'

    const formatedEnd = formatInTimeZone(endTime, this._userTimeZone, 'HH:mm')

    return formatedStart + '-' + (formatedEnd === '00:00' ? '24:00' : formatedEnd)
  }
}
