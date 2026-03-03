import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TimeTrackingService } from './time-tracking.service'
import { SessionEntity } from '../entities/session.entity'
import type { SessionRepository, IdGenerator } from '../ports/repository.port'
import type { SessionDTO } from '../entities/session.entity'

vi.mock('../entities/session.entity', () => ({
  SessionEntity: {
    create: vi.fn(),
    restore: vi.fn(),
  },
}))

describe('TimeTrackingService', () => {
  let mockRepository: SessionRepository
  let mockIdGenerator: IdGenerator
  let service: TimeTrackingService

  let fakeSession: SessionEntity

  const BASE_TIME = 1_704_110_400_000 // 2024-01-01T10:00:00Z
  const MINUTE = 60_000

  const createSession = (overrides?: Partial<SessionDTO>): SessionDTO => ({
    id: 'sess-456',
    taskId: null,
    timeBlockId: null,
    status: 'completed',
    intervals: [],
    startTime: BASE_TIME,
    endTime: null,
    ...overrides,
  })

  beforeEach(() => {
    vi.clearAllMocks()

    mockRepository = {
      save: vi.fn(),
      findAll: vi.fn(),
      findActive: vi.fn(),
    } as unknown as SessionRepository

    mockIdGenerator = vi.fn().mockReturnValue('test-id-123')

    fakeSession = {
      toData: vi.fn().mockReturnValue({ id: 'test-id-123' }),
      pause: vi.fn(),
      resume: vi.fn(),
      stop: vi.fn(),
    } as unknown as SessionEntity

    vi.mocked(SessionEntity.create).mockImplementation((generator) => {
      generator()
      return fakeSession
    })

    vi.mocked(SessionEntity.restore).mockReturnValue(fakeSession)

    service = new TimeTrackingService(mockRepository, mockIdGenerator)
  })

  describe('startSession', () => {
    it('should create and save a new session when no active session exists', async () => {
      vi.mocked(mockRepository.findActive).mockResolvedValue(null)
      const params = { taskId: 'task-1', timeBlockId: 'block-1' }

      const result = await service.startSession(params)

      expect(result.success).toBe(true)
      expect(mockIdGenerator).toHaveBeenCalledOnce()
      expect(SessionEntity.create).toHaveBeenCalledWith(mockIdGenerator, params)
      expect(fakeSession.toData).toHaveBeenCalledOnce()
      expect(mockRepository.save).toHaveBeenCalledWith({ id: 'test-id-123' })
    })

    it('should return error when active session exists', async () => {
      const activeDTO = { id: 'active-1' } as SessionDTO
      vi.mocked(mockRepository.findActive).mockResolvedValue(activeDTO)
      const params = { taskId: 'task-1', timeBlockId: 'block-1' }

      const result = await service.startSession(params)

      expect(result.success).toBe(false)
      if (!result.success)
        expect(result.error).toBe('Cannot start a new session while another is active')
      expect(SessionEntity.create).not.toHaveBeenCalled()
      expect(mockRepository.save).not.toHaveBeenCalled()
    })

    it('should handle repository error during findActive', async () => {
      vi.mocked(mockRepository.findActive).mockRejectedValue(new Error('DB error'))
      const params = { taskId: 'task-1', timeBlockId: 'block-1' }

      const result = await service.startSession(params)

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toBe('DB error')
    })

    it('should handle error during session creation or save', async () => {
      vi.mocked(mockRepository.findActive).mockResolvedValue(null)

      vi.mocked(mockRepository.save).mockRejectedValue(new Error('Save failed'))
      const params = { taskId: 'task-1', timeBlockId: 'block-1' }

      const result = await service.startSession(params)

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toBe('Save failed')
    })
  })

  describe('findAllSessions', () => {
    it('should return all sessions', async () => {
      const sessions: SessionDTO[] = [{ id: '1' } as SessionDTO, { id: '2' } as SessionDTO]
      vi.mocked(mockRepository.findAll).mockResolvedValue(sessions)

      const result = await service.findAllSessions()

      expect(result.success).toBe(true)
      if (result.success) expect(result.value).toEqual(sessions)
    })

    it('should handle repository error', async () => {
      vi.mocked(mockRepository.findAll).mockRejectedValue(new Error('Find error'))

      const result = await service.findAllSessions()

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toBe('Find error')
    })
  })

  describe('pauseSession', () => {
    it('should pause active session and save', async () => {
      const activeDTO = { id: 'active-1' } as SessionDTO
      vi.mocked(mockRepository.findActive).mockResolvedValue(activeDTO)

      const result = await service.pauseSession()

      expect(result.success).toBe(true)
      expect(SessionEntity.restore).toHaveBeenCalledWith(activeDTO)
      expect(fakeSession.pause).toHaveBeenCalledOnce()
      expect(fakeSession.toData).toHaveBeenCalledOnce()
      expect(mockRepository.save).toHaveBeenCalledWith({ id: 'test-id-123' })
    })

    it('should return error if no active session (findActive returns null)', async () => {
      vi.mocked(mockRepository.findActive).mockResolvedValue(null)

      const result = await service.pauseSession()

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toBe('Failed to find active session')
      expect(SessionEntity.restore).not.toHaveBeenCalled()
      expect(fakeSession.pause).not.toHaveBeenCalled()
      expect(mockRepository.save).not.toHaveBeenCalled()
    })

    it('should return error if findActive throws', async () => {
      vi.mocked(mockRepository.findActive).mockRejectedValue(new Error('DB error'))

      const result = await service.pauseSession()

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toBe('DB error')
      expect(SessionEntity.restore).not.toHaveBeenCalled()
    })

    it('should handle error during pause or save', async () => {
      const activeDTO = { id: 'active-1' } as SessionDTO
      vi.mocked(mockRepository.findActive).mockResolvedValue(activeDTO)
      vi.mocked(mockRepository.save).mockRejectedValue(new Error('Save failed'))

      const result = await service.pauseSession()

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toBe('Save failed')
    })
  })

  describe('resumeSession', () => {
    it('should resume active session and save', async () => {
      const activeDTO = { id: 'active-1' } as SessionDTO
      vi.mocked(mockRepository.findActive).mockResolvedValue(activeDTO)

      const result = await service.resumeSession()

      expect(result.success).toBe(true)
      expect(SessionEntity.restore).toHaveBeenCalledWith(activeDTO)
      expect(fakeSession.resume).toHaveBeenCalledOnce()
      expect(fakeSession.toData).toHaveBeenCalledOnce()
      expect(mockRepository.save).toHaveBeenCalledWith({ id: 'test-id-123' })
    })

    it('should return error if no active session', async () => {
      vi.mocked(mockRepository.findActive).mockResolvedValue(null)

      const result = await service.resumeSession()

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toBe('Failed to find active session')
    })

    it('should handle repository error', async () => {
      vi.mocked(mockRepository.findActive).mockRejectedValue(new Error('DB error'))

      const result = await service.resumeSession()

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toBe('DB error')
    })
  })

  describe('stopSession', () => {
    it('should stop active session and save', async () => {
      const activeDTO = { id: 'active-1' } as SessionDTO
      vi.mocked(mockRepository.findActive).mockResolvedValue(activeDTO)

      const result = await service.stopSession()

      expect(result.success).toBe(true)
      expect(SessionEntity.restore).toHaveBeenCalledWith(activeDTO)
      expect(fakeSession.stop).toHaveBeenCalledOnce()
      expect(fakeSession.toData).toHaveBeenCalledOnce()
      expect(mockRepository.save).toHaveBeenCalledWith({ id: 'test-id-123' })
    })

    it('should return error if no active session', async () => {
      vi.mocked(mockRepository.findActive).mockResolvedValue(null)

      const result = await service.stopSession()

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toBe('Failed to find active session')
    })

    it('should handle repository error', async () => {
      vi.mocked(mockRepository.findActive).mockRejectedValue(new Error('DB error'))

      const result = await service.stopSession()

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toBe('DB error')
    })
  })

  describe('getTotalWorkTime', () => {
    it('should return correct time for completed session with break', () => {
      const session = createSession({
        intervals: [
          {
            sessionId: 'sess-456',
            type: 'work',
            startTime: BASE_TIME,
            endTime: BASE_TIME + 20 * MINUTE,
          },
          {
            sessionId: 'sess-456',
            type: 'break',
            startTime: BASE_TIME + 20 * MINUTE,
            endTime: BASE_TIME + 30 * MINUTE,
          },
          {
            sessionId: 'sess-456',
            type: 'work',
            startTime: BASE_TIME + 30 * MINUTE,
            endTime: BASE_TIME + 60 * MINUTE,
          },
        ],
      })
      expect(service.getTotalWorkTime(session)).toBe(50)
    })

    it('should return correct time for completed session without breaks', () => {
      const session = createSession({
        intervals: [
          {
            sessionId: 'sess-456',
            type: 'work',
            startTime: BASE_TIME,
            endTime: BASE_TIME + 60 * MINUTE,
          },
        ],
      })
      expect(service.getTotalWorkTime(session)).toBe(60)
    })

    it('should return correct time for active session with break and open interval', () => {
      const session = createSession({
        intervals: [
          {
            sessionId: 'sess-456',
            type: 'work',
            startTime: BASE_TIME,
            endTime: BASE_TIME + 20 * MINUTE,
          },
          {
            sessionId: 'sess-456',
            type: 'break',
            startTime: BASE_TIME + 20 * MINUTE,
            endTime: BASE_TIME + 30 * MINUTE,
          },
          {
            sessionId: 'sess-456',
            type: 'work',
            startTime: BASE_TIME + 30 * MINUTE,
            endTime: null,
          },
        ],
      })
      expect(service.getTotalWorkTime(session)).toBe(20)
    })
  })
})
