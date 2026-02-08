import {
  CreateTaskUseCase,
  CreateTaskInput,
  ListTasksUseCase,
  GetSpecificTaskUseCase,
} from '@planning-system/core'
import { KnexTaskRepository } from './persistence/repositories/task.repo.js'
import { v4 as uuid } from 'uuid'
import { DatabaseConnection } from './persistence/db.js'

export class CLIAdapter {
  constructor(private readonly taskRepo: KnexTaskRepository) {}

  static async create() {
    const db = await DatabaseConnection.getConnection()
    const taskRepo = new KnexTaskRepository(db)

    return new CLIAdapter(taskRepo)
  }

  async createTask(input: CreateTaskInput) {
    return await new CreateTaskUseCase(this.taskRepo, uuid).execute(input)
  }

  async listTasks() {
    return await new ListTasksUseCase(this.taskRepo).execute()
  }

  async getSpecificTask(id: string) {
    return await new GetSpecificTaskUseCase(this.taskRepo).execute(id)
  }
}
