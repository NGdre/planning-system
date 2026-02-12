import { describe, it as test, expect, vi, beforeEach, afterEach } from 'vitest'
import { PlannerService } from './planner.service.js'
import { TimeBlockDTO, TimeBlockEntity } from '../entities/time-block.entity.js'
import type { TimeBlockRepository, IdGenerator } from '../ports/repository.port.js'

const mockTimeBlockRepository: TimeBlockRepository = {
  save: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
  findByTaskId: vi.fn(),
  findAllWithin: vi.fn(),
}

const mockIdGenerator: IdGenerator = vi.fn()

describe('PlannerService', () => {
  let plannerService: PlannerService

  beforeEach(() => {
    vi.useFakeTimers()

    plannerService = new PlannerService(mockTimeBlockRepository, mockIdGenerator)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('schedule', () => {
    test.each([
      {
        now: '2024-01-01T10:00:00',
        start: '2024-01-01T09:00:00',
        end: '2024-01-01T10:00:00',
        description: 'текущее время равно времени окончания',
      },
      {
        now: '2024-01-01T09:30:00',
        start: '2024-01-01T09:00:00',
        end: '2024-01-01T10:00:00',
        description: 'текущее время между началом и концом',
      },
      {
        now: '2024-01-01T11:00:00',
        start: '2024-01-01T09:00:00',
        end: '2024-01-01T10:00:00',
        description: 'текущее время позже времени окончания',
      },
    ])(
      'должен возвращать false, если время не в будущем: $description',
      async ({ now, start, end }) => {
        vi.setSystemTime(new Date(now))

        const result = await plannerService.schedule('task-1', new Date(start), new Date(end))

        expect(result.success).toBe(false)
      }
    )

    test('должен возвращать false при пересечении с существующим TimeBlock', async () => {
      const now = new Date('2024-01-01T10:00:00')
      vi.setSystemTime(now)

      const startTime = new Date('2024-01-01T14:00:00')
      const endTime = new Date('2024-01-01T15:00:00')

      vi.mocked(mockIdGenerator).mockReturnValue('generated-id-1')

      const existingTimeBlock: TimeBlockDTO = {
        id: 'existing-id',
        taskId: 'task-2',
        startTime: new Date('2024-01-01T14:30:00').getTime(),
        endTime: new Date('2024-01-01T15:30:00').getTime(),
        createdAt: new Date('2023-01-01T14:30:00').getTime(),
        rescheduledTimes: 1,
      }

      vi.mocked(mockTimeBlockRepository.findAllWithin).mockResolvedValue([existingTimeBlock])

      const result = await plannerService.schedule('task-1', startTime, endTime)

      expect(result.success).toBe(false)
      expect(mockTimeBlockRepository.findAllWithin).toHaveBeenCalled()
      expect(mockTimeBlockRepository.save).toHaveBeenCalledTimes(0)
    })

    test('должен возвращать false если временной блок планируется более чем за месяц вперед', async () => {
      const now = new Date('2024-03-02T10:00:00')
      vi.setSystemTime(now)

      const startTime = new Date('2024-04-02T09:00:00')
      const endTime = new Date('2024-04-02T10:00:00')

      vi.mocked(mockTimeBlockRepository.findByTaskId).mockResolvedValue(null)
      const result = await plannerService.schedule('task-1', startTime, endTime)

      expect(result.success).toBe(false)
    })

    test('should return false when a time block exist for the task', async () => {
      const now = new Date('2024-01-01T10:00:00')
      vi.setSystemTime(now)

      const startTime = new Date('2024-01-01T14:00:00')
      const endTime = new Date('2024-01-01T15:00:00')

      vi.mocked(mockTimeBlockRepository.findByTaskId).mockResolvedValue(null)

      const result = await plannerService.schedule('task-1', startTime, endTime)

      expect(result.success).toBe(false)
      expect(mockTimeBlockRepository.save).toHaveBeenCalledTimes(0)
    })

    test('должен возвращать true при успешном планировании и сохранять блок', async () => {
      const now = new Date('2024-01-01T10:00:00')
      vi.setSystemTime(now)

      const startTime = new Date('2024-01-01T14:00:00')
      const endTime = new Date('2024-01-01T15:00:00')

      vi.mocked(mockIdGenerator).mockReturnValue('generated-id-1')
      vi.mocked(mockTimeBlockRepository.findAllWithin).mockResolvedValue([])
      vi.mocked(mockTimeBlockRepository.findByTaskId).mockResolvedValue(null)

      const result = await plannerService.schedule('task-1', startTime, endTime)

      const desiredTimeBlock = TimeBlockEntity.create(mockIdGenerator, {
        taskId: 'task-1',
        startTime,
        endTime,
      })

      expect(result.success).toBe(true)
      expect(mockTimeBlockRepository.findAllWithin).toHaveBeenCalled()
      expect(mockTimeBlockRepository.save).toHaveBeenCalledWith(desiredTimeBlock.toData())
    })

    test('должен искать пересечения в правильном временном диапазоне', async () => {
      const now = new Date('2024-01-01T10:00:00')
      vi.setSystemTime(now)

      const startTime = new Date('2024-01-01T14:00:00')
      const endTime = new Date('2024-01-01T15:00:00')

      vi.mocked(mockTimeBlockRepository.findAllWithin).mockResolvedValue([])

      await plannerService.schedule('task-1', startTime, endTime)

      const maxMsInTimeBlock = TimeBlockEntity.maxTimeBlockHours * 60 * 60 * 1000
      const expectedLeft = startTime.getTime() - maxMsInTimeBlock
      const expectedRight = endTime.getTime() + maxMsInTimeBlock

      expect(mockTimeBlockRepository.findAllWithin).toHaveBeenCalledWith(
        expectedLeft,
        expectedRight
      )
    })
  })

  describe('findAvailableSlots', () => {
    const createBusyDTO = (start: Date, end: Date, id = 'busy') => ({
      id,
      taskId: 'task',
      startTime: start.getTime(),
      endTime: end.getTime(),
      createdAt: Date.now(),
      rescheduledTimes: 0,
    })

    test('returns the entire interval as a single slot if it is longer than 15 minutes and there are no busy slots', async () => {
      const from = new Date('2024-01-01T10:00:00')
      const to = new Date('2024-01-01T12:00:00')

      vi.mocked(mockTimeBlockRepository.findAllWithin).mockResolvedValue([])

      const result = await plannerService.findAvailableSlots(from, to)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toHaveLength(1)
        expect(result.value[0]).toEqual({
          startTime: from,
          endTime: to,
        })
      }
      expect(mockTimeBlockRepository.findAllWithin).toHaveBeenCalledWith(
        from.getTime(),
        to.getTime()
      )
    })

    test('does not return any slots if the entire time is busy', async () => {
      const from = new Date('2024-01-01T10:00:00')
      const to = new Date('2024-01-01T12:00:00')

      const busy = createBusyDTO(from, to)
      vi.mocked(mockTimeBlockRepository.findAllWithin).mockResolvedValue([busy])

      const result = await plannerService.findAvailableSlots(from, to)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toEqual([])
      }
    })

    test('does not add a gap shorter than 15 minutes', async () => {
      const from = new Date('2024-01-01T10:00:00')
      const to = new Date('2024-01-01T12:00:00')

      // block 10:00–11:00, next block 11:05–12:00: gap 5 min
      const block1 = createBusyDTO(new Date('2024-01-01T10:00:00'), new Date('2024-01-01T11:00:00'))
      const block2 = createBusyDTO(new Date('2024-01-01T11:05:00'), new Date('2024-01-01T12:00:00'))

      vi.mocked(mockTimeBlockRepository.findAllWithin).mockResolvedValue([block1, block2])

      const result = await plannerService.findAvailableSlots(from, to)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toEqual([])
      }
    })

    test('adds a gap of exactly 15 minutes', async () => {
      const from = new Date('2024-01-01T10:00:00')
      const to = new Date('2024-01-01T12:00:00')

      // gap 15 minutes (10:45–11:00)
      const block1 = createBusyDTO(new Date('2024-01-01T10:00:00'), new Date('2024-01-01T10:45:00'))
      const block2 = createBusyDTO(new Date('2024-01-01T11:00:00'), new Date('2024-01-01T12:00:00'))

      vi.mocked(mockTimeBlockRepository.findAllWithin).mockResolvedValue([block1, block2])

      const result = await plannerService.findAvailableSlots(from, to)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toHaveLength(1)
        expect(result.value[0]).toEqual({
          startTime: new Date('2024-01-01T10:45:00'),
          endTime: new Date('2024-01-01T11:00:00'),
        })
      }
    })

    test('correctly handles a block that starts at from', async () => {
      const from = new Date('2024-01-01T10:00:00')
      const to = new Date('2024-01-01T12:00:00')

      const busy = createBusyDTO(from, new Date('2024-01-01T11:00:00'))
      vi.mocked(mockTimeBlockRepository.findAllWithin).mockResolvedValue([busy])

      const result = await plannerService.findAvailableSlots(from, to)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toHaveLength(1)
        expect(result.value[0]).toEqual({
          startTime: new Date('2024-01-01T11:00:00'),
          endTime: to,
        })
      }
    })

    test('correctly handles a block that ends at to', async () => {
      const from = new Date('2024-01-01T10:00:00')
      const to = new Date('2024-01-01T12:00:00')

      const busy = createBusyDTO(new Date('2024-01-01T11:00:00'), to)
      vi.mocked(mockTimeBlockRepository.findAllWithin).mockResolvedValue([busy])

      const result = await plannerService.findAvailableSlots(from, to)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toHaveLength(1)
        expect(result.value[0]).toEqual({
          startTime: from,
          endTime: new Date('2024-01-01T11:00:00'),
        })
      }
    })

    test('finds all suitable gaps between multiple blocks', async () => {
      const from = new Date('2024-01-01T09:00:00')
      const to = new Date('2024-01-01T18:00:00')

      const blocks = [
        createBusyDTO(new Date('2024-01-01T09:00:00'), new Date('2024-01-01T10:00:00')),
        createBusyDTO(new Date('2024-01-01T11:00:00'), new Date('2024-01-01T12:30:00')),
        createBusyDTO(new Date('2024-01-01T13:00:00'), new Date('2024-01-01T14:00:00')),
      ]

      vi.mocked(mockTimeBlockRepository.findAllWithin).mockResolvedValue(blocks)

      const result = await plannerService.findAvailableSlots(from, to)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toEqual([
          { startTime: new Date('2024-01-01T10:00:00'), endTime: new Date('2024-01-01T11:00:00') },
          { startTime: new Date('2024-01-01T12:30:00'), endTime: new Date('2024-01-01T13:00:00') },
          { startTime: new Date('2024-01-01T14:00:00'), endTime: new Date('2024-01-01T18:00:00') },
        ])
      }
    })

    test('returns an empty array if from equals to', async () => {
      const date = new Date('2024-01-01T12:00:00')
      vi.mocked(mockTimeBlockRepository.findAllWithin).mockResolvedValue([])

      const result = await plannerService.findAvailableSlots(date, date)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.value).toEqual([])
      }
    })

    test('returns a Result with an error if the repository fails', async () => {
      const from = new Date()
      const to = new Date(from.getTime() + 3600000)
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      vi.mocked(mockTimeBlockRepository.findAllWithin).mockRejectedValue(new Error('DB error'))

      const result = await plannerService.findAvailableSlots(from, to)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('DB error')
      }

      consoleErrorSpy.mockRestore()
    })
  })

  describe('findClosestTimeBlocks', () => {
    // сомнительной полезности тест
    test('должен искать блоки в расширенном диапазоне', async () => {
      const startTime = new Date('2024-01-01T14:00:00')
      const endTime = new Date('2024-01-01T15:00:00')

      const maxMsInTimeBlock = TimeBlockEntity.maxTimeBlockHours * 60 * 60 * 1000
      const expectedLeft = startTime.getTime() - maxMsInTimeBlock
      const expectedRight = endTime.getTime() + maxMsInTimeBlock

      vi.mocked(mockTimeBlockRepository.findAllWithin).mockResolvedValue([])

      await plannerService.findClosestTimeBlocks(startTime, endTime)

      expect(mockTimeBlockRepository.findAllWithin).toHaveBeenCalledWith(
        expectedLeft,
        expectedRight
      )
    })
  })

  // возможно дублируется проверка с тестированием schedule
  describe('isFutureTimeBlock', () => {
    test('должен возвращать true для будущего времени', () => {
      const now = new Date('2024-01-01T10:00:00')
      vi.setSystemTime(now)

      const startTime = new Date('2024-01-01T11:00:00')
      const endTime = new Date('2024-01-01T12:00:00')

      // @ts-expect-error - тестируем приватный метод
      expect(plannerService.isFutureTimeBlock(startTime, endTime)).toBe(true)
    })

    test('должен возвращать false для прошедшего времени', () => {
      const now = new Date('2024-01-01T10:00:00')
      vi.setSystemTime(now)

      const startTime = new Date('2024-01-01T09:00:00')
      const endTime = new Date('2024-01-01T10:00:00')

      // @ts-expect-error - тестируем приватный метод
      expect(plannerService.isFutureTimeBlock(startTime, endTime)).toBe(false)
    })
  })
})
