import { TaskDTO, TaskEntity } from '../entities/task.entity.js'
import { IdGenerator, TaskRepository } from '../ports/repository.port.js'
import { TaskAction, UserActionsService } from '../services/user-actions.service.js'

export interface CreateTaskInput {
  title: string
  description?: string
}

export type TaskDetails = TaskDTO & { taskActions: TaskAction[] }

export class CreateTaskUseCase {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly idGenerator: IdGenerator
  ) {}

  async execute(input: CreateTaskInput): Promise<TaskDTO> {
    const task = TaskEntity.create(this.idGenerator, { title: input.title })

    await this.taskRepository.save(task.toData())

    return task.toData()
  }
}

export class ListTasksUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(): Promise<TaskDTO[]> {
    return this.taskRepository.findAll()
  }
}

export class GetSpecificTaskUseCase {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly userActionsService: UserActionsService
  ) {}

  async execute(id: string): Promise<TaskDetails> {
    const task = await this.taskRepository.findById(id)

    if (!task) throw new Error('task is not found')

    const taskActions = this.userActionsService.getTaskActions(task)

    return Object.assign(task, { taskActions })
  }
}
