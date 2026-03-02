import { SessionDTO } from '../entities/session.entity.js'
import { TaskDTO } from '../entities/task.entity.js'
import { TimeBlockDTO } from '../entities/time-block.entity.js'

export interface TaskRepository {
  save(task: TaskDTO): Promise<void>
  findAll(): Promise<TaskDTO[]>
  findById(id: string): Promise<TaskDTO | null>
}

export interface TimeBlockRepository {
  save(timeBlock: TimeBlockDTO): Promise<void>
  findAll(): Promise<TimeBlockDTO[]>
  findById(id: string): Promise<TimeBlockDTO | null>
  findByTaskId(taskId: string): Promise<TimeBlockDTO | null>
  findAllWithin(firstDate: number, secondDate: number): Promise<TimeBlockDTO[]>
}

export interface SessionRepository {
  save(session: SessionDTO): Promise<void>
  findAll(): Promise<SessionDTO[]>
  findById(id: string): Promise<SessionDTO | null>
  findByTaskId(taskId: string): Promise<SessionDTO | null>
  findByTimeBlockId(timeBlockId: string): Promise<SessionDTO | null>
  findActive(): Promise<SessionDTO | null>
}

export interface Repository {
  tasks: TaskRepository
  timeBlocks: TimeBlockRepository
  sessions: SessionRepository
}

export type IdGenerator = () => string
