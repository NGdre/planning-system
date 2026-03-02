import { Knex } from 'knex'
import { SessionDTO, IntervalDTO, SessionRepository } from '@planning-system/core'

export class KnexSessionRepository implements SessionRepository {
  constructor(private readonly db: Knex) {}

  async save(session: SessionDTO): Promise<void> {
    await this.db.transaction(async (trx) => {
      const { intervals, ...sessionWithoutIntervals } = session

      await trx('session').insert(sessionWithoutIntervals).onConflict('id').merge({
        endTime: session.endTime,
        status: session.status,
      })

      await trx('interval').where('sessionId', session.id).delete()

      if (session.intervals.length > 0) {
        await trx('interval').insert(intervals)
      }
    })
  }

  async findAll(): Promise<SessionDTO[]> {
    const sessionRows = await this.db('session').orderBy('startTime', 'desc')

    if (sessionRows.length === 0) return []

    const sessionIds = sessionRows.map((row) => row.id)
    const intervalRows = await this.db('interval')
      .whereIn('sessionId', sessionIds)
      .orderBy('startTime', 'asc')

    const intervalsBySession = new Map<string, IntervalDTO[]>()

    for (const row of intervalRows) {
      const sessionId = row.sessionId

      if (!intervalsBySession.has(sessionId)) {
        intervalsBySession.set(sessionId, [])
      }

      intervalsBySession.get(sessionId)!.push(row)
    }

    return sessionRows.map((row) => ({
      ...row,
      intervals: intervalsBySession.get(row.id) || [],
    }))
  }

  async findActive(): Promise<SessionDTO | null> {
    const sessionRow = await this.db('session').where('status', 'active').first()
    if (!sessionRow) return null

    const intervalRows = await this.findAllIntervals(sessionRow.id)

    return {
      ...sessionRow,
      intervals: intervalRows,
    }
  }

  async findById(id: string): Promise<SessionDTO | null> {
    const sessionRow = await this.db('session').where('id', id).first()
    if (!sessionRow) return null

    const intervalRows = await this.findAllIntervals(sessionRow.id)

    return {
      ...sessionRow,
      intervals: intervalRows,
    }
  }

  async findByTaskId(taskId: string): Promise<SessionDTO | null> {
    const sessionRow = await this.db('session').where('task_id', taskId).first()

    if (!sessionRow) return null

    const intervalRows = await this.findAllIntervals(sessionRow.id)

    return {
      ...sessionRow,
      intervals: intervalRows,
    }
  }

  async findByTimeBlockId(timeBlockId: string): Promise<SessionDTO | null> {
    const sessionRow = await this.db('session').where('timeBlockId', timeBlockId).first()

    if (!sessionRow) return null

    const intervalRows = await this.findAllIntervals(sessionRow.id)

    return {
      ...sessionRow,
      intervals: intervalRows,
    }
  }

  private async findAllIntervals(sessionId: string): Promise<IntervalDTO[]> {
    return await this.db('interval').where('sessionId', sessionId).orderBy('startTime', 'asc')
  }
}
