import {
  CreateTaskUseCase,
  CreateTaskInput,
  ListTasksUseCase,
  GetSpecificTaskUseCase,
  UserActionsService,
} from '@planning-system/core'
import { KnexTaskRepository } from './persistence/repositories/task.repo.js'
import { v4 as uuid } from 'uuid'
import { DatabaseConnection } from './persistence/db.js'

export class CLIAdapter {
  constructor(
    private readonly taskRepo: KnexTaskRepository,
    private readonly userActionsService: UserActionsService
  ) {}

  static async create() {
    const db = await DatabaseConnection.getConnection()
    const taskRepo = new KnexTaskRepository(db)
    const userActionsService = new UserActionsService()

    return new CLIAdapter(taskRepo, userActionsService)
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
}
