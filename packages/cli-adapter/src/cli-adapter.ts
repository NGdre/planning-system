import {
  CreateTaskUseCase,
  CreateTaskInput,
  ListTasksUseCase,
  GetSpecificTaskUseCase,
  UserActionsService,
  ScheduleTimeBlockForTask,
  PlannerService,
  ShowAvailableSlotsForDayUseCase,
} from '@planning-system/core'
import { KnexTaskRepository } from './persistence/repositories/task.repo.js'
import { v4 as uuid } from 'uuid'
import { DatabaseConnection } from './persistence/db.js'
import { KnexTimeBlockRepository } from './persistence/repositories/time-block.repo.js'

export class CLIAdapter {
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
    const plannerService = new PlannerService(timeBlockRepo, uuid)

    return new CLIAdapter(taskRepo, timeBlockRepo, userActionsService, plannerService)
  }

  async createTask(input: CreateTaskInput) {
    return await new CreateTaskUseCase(this.taskRepo, uuid).execute(input)
  }

  async listTasks() {
    return await new ListTasksUseCase(this.taskRepo).execute()
  }

  async getSpecificTask(id: string) {
    return await new GetSpecificTaskUseCase(this.taskRepo, this.userActionsService).execute(id)
  }

  async schedule(taskId: string, startTime: string, endTime: string) {
    return await new ScheduleTimeBlockForTask(this.plannerService).execute(
      taskId,
      startTime,
      endTime
    )
  }

  async showAvailableSlots(day: string) {
    return await new ShowAvailableSlotsForDayUseCase(this.plannerService).execute(day)
  }
}
