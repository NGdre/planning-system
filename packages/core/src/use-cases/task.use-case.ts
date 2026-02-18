import { TaskDTO, TaskEntity } from '../entities/task.entity.js'
import { TimeBlock, TimeBlockEntity } from '../entities/time-block.entity.js'
import { IdGenerator, TaskRepository, TimeBlockRepository } from '../ports/repository.port.js'
import { TaskAction, UserActionsService } from '../services/user-actions.service.js'
import { Result } from '../types.js'

export interface CreateTaskInput {
  title: string
  description?: string
}

export type TaskDetails = TaskDTO & { taskActions: TaskAction[] } & Partial<TimeBlock>

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
    private readonly timeBlockRepository: TimeBlockRepository,
    private readonly userActionsService: UserActionsService
  ) {}

  async execute(id: string): Promise<Result<TaskDetails>> {
    const task = await this.taskRepository.findById(id)
    const timeBlockDTO = await this.timeBlockRepository.findByTaskId(id)

    if (!task)
      return {
        success: false,
        error: 'task is not found',
      }

    let timeBlock

    if (timeBlockDTO) {
      const tbe = TimeBlockEntity.restore(timeBlockDTO)
      timeBlock = { startTime: tbe.startTime, endTime: tbe.endTime }
    }

    const taskActions = this.userActionsService.getTaskActions(task)

    return {
      success: true,
      value: Object.assign(task, { taskActions }, timeBlock),
    }
  }
}
