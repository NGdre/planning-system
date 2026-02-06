import { TaskDTO, TaskEntity } from '../entities/task.entity'
import { IdGenerator, TaskRepository } from '../ports/repository.port'

export interface CreateTaskInput {
  title: string
  description?: string
}

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
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(id: string): Promise<TaskDTO> {
    const task = await this.taskRepository.findById(id)

    if (!task) throw new Error('task is not found')
    else return task
  }
}
