import { SessionDTO, SessionEntity } from '../entities/session.entity.js'
import { IdGenerator, SessionRepository } from '../ports/repository.port.js'
import { Result, VoidResult } from '../types.js'

export class TimeTrackingService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly idGenerator: IdGenerator
  ) {}

  async startSession(sessionParams: {
    taskId: string | null
    timeBlockId: string | null
  }): Promise<VoidResult> {
    try {
      const activeSession = await this.sessionRepository.findActive()

      if (activeSession) {
        return {
          success: false,
          error: 'Cannot start a new session while another is active',
        }
      }

      const session = SessionEntity.create(this.idGenerator, sessionParams)
      await this.sessionRepository.save(session.toData())

      return { success: true }
    } catch (error) {
      console.error('Failed to start session:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async findAllSessions(): Promise<Result<SessionDTO[]>> {
    try {
      const sessions = await this.sessionRepository.findAll()

      return {
        success: true,
        value: sessions,
      }
    } catch (error) {
      console.error('Failed to find sessions:', error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async pauseSession(): Promise<VoidResult> {
    try {
      const sessionDTO = await this.findActiveSession()

      if (!sessionDTO.success) return sessionDTO

      const session = SessionEntity.restore(sessionDTO.value)

      session.pause()

      await this.sessionRepository.save(session.toData())

      return {
        success: true,
      }
    } catch (error) {
      console.error('Failed to pause session:', error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async resumeSession(): Promise<VoidResult> {
    try {
      const sessionDTO = await this.findActiveSession()

      if (!sessionDTO.success) return sessionDTO

      const session = SessionEntity.restore(sessionDTO.value)

      session.resume()

      await this.sessionRepository.save(session.toData())

      return {
        success: true,
      }
    } catch (error) {
      console.error('Failed to resume session:', error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async stopSession(): Promise<VoidResult> {
    try {
      const sessionDTO = await this.findActiveSession()

      if (!sessionDTO.success) return sessionDTO

      const session = SessionEntity.restore(sessionDTO.value)

      session.stop()

      await this.sessionRepository.save(session.toData())

      return {
        success: true,
      }
    } catch (error) {
      console.error('Failed to stop session:', error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Calculates total work time in minutes for closed intervals
   * @param session - The DTO containing session data.
   * @returns total work time in minutes
   */
  getTotalWorkTime(session: SessionDTO): number {
    const totalMs = session.intervals.reduce((total, interval) => {
      if (interval.type === 'break' || interval.endTime === null) return total

      return total + interval.endTime - interval.startTime
    }, 0)

    return Math.floor(totalMs / 60000)
  }

  private async findActiveSession(): Promise<Result<SessionDTO>> {
    try {
      const sessionDTO = await this.sessionRepository.findActive()

      if (!sessionDTO)
        return {
          success: false,
          error: 'Failed to find active session',
        }

      return {
        success: true,
        value: sessionDTO,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
