import { TimeBlockRepository, TimeBlockDTO } from '@planning-system/core'
import { Knex } from 'knex'

export class KnexTimeBlockRepository implements TimeBlockRepository {
  private readonly tableName = 'time_block'

  constructor(private readonly db: Knex) {}

  async save(task: TimeBlockDTO): Promise<void> {
    try {
      await this.db(this.tableName).insert(task).onConflict('id').merge()
    } catch (error) {
      console.error('Error adding task:', error)
      throw error
    }
  }

  async findById(id: string): Promise<TimeBlockDTO | null> {
    try {
      const result = await this.db(this.tableName).where({ id }).first()

      return result || null
    } catch (error) {
      console.error('Error finding time block by id:', error)
      throw error
    }
  }

  async findByTaskId(taskId: string): Promise<TimeBlockDTO | null> {
    try {
      const result = await this.db(this.tableName).where({ taskId }).first()

      return result || null
    } catch (error) {
      console.error('Error finding time block by task id:', error)
      throw error
    }
  }

  async findAll(): Promise<TimeBlockDTO[]> {
    try {
      return await this.db(this.tableName).select('*')
    } catch (error) {
      console.error('Error getting all time blocks:', error)
      throw error
    }
  }

  async findAllWithin(startDate: number, endDate: number): Promise<TimeBlockDTO[]> {
    try {
      return await this.db(this.tableName)
        .where('start_time', '>=', startDate)
        .where('end_time', '<=', endDate)
        .orderBy('start_time', 'asc')
    } catch (error) {
      console.error('Error getting all time blocks within date range:', error)
      throw error
    }
  }
}
