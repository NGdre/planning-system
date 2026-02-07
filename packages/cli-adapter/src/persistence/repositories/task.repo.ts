import { TaskRepository, TaskDTO } from '@planning-system/core'
import { Knex } from 'knex'

export class KnexTaskRepository implements TaskRepository {
  private readonly tableName = 'task'

  constructor(private readonly db: Knex) {}

  async save(task: TaskDTO): Promise<void> {
    try {
      await this.db(this.tableName).insert(task).onConflict('id').merge()
    } catch (error) {
      console.error('Error adding task:', error)
      throw error
    }
  }

  async findById(id: string): Promise<TaskDTO | null> {
    try {
      const result = await this.db(this.tableName).where({ id }).first()

      return result || null
    } catch (error) {
      console.error('Error finding task by id:', error)
      throw error
    }
  }

  async findAll(): Promise<TaskDTO[]> {
    try {
      return await this.db(this.tableName).select('*')
    } catch (error) {
      console.error('Error getting all tasks:', error)
      throw error
    }
  }
}
