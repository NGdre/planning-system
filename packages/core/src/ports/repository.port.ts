import { TaskDTO } from '../entities/task.entity.js'

export interface TaskRepository {
  save(task: TaskDTO): Promise<void>
  findAll(): Promise<TaskDTO[]>
  findById(id: string): Promise<TaskDTO | null>
}

export interface Repository {
  tasks: TaskRepository
}

export type IdGenerator = () => string
