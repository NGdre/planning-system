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
  let originalDate: DateConstructor

  beforeEach(() => {
    originalDate = global.Date

    plannerService = new PlannerService(mockTimeBlockRepository, mockIdGenerator)
    vi.clearAllMocks()
  })

  afterEach(() => {
    global.Date = originalDate
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
    test('works correctly for blocks in between day boundaries', async () => {
      const day = new Date(2024, 0, 3)

      const timeBlocks: TimeBlockDTO[] = [
        {
          id: 'existing-id-1',
          taskId: 'task-1',
          startTime: new Date(day).setHours(1),
          endTime: new Date(day).setHours(2),
          createdAt: new Date('2023-01-01T14:30:00').getTime(),
          rescheduledTimes: 1,
        },
        {
          id: 'existing-id-2',
          taskId: 'task-2',
          startTime: new Date(day).setHours(3),
          endTime: new Date(day).setHours(6),
          createdAt: new Date('2023-01-01T14:30:00').getTime(),
          rescheduledTimes: 1,
        },
      ]

      vi.mocked(mockTimeBlockRepository.findAllWithin).mockResolvedValue(timeBlocks)

      const result = await plannerService.findAvailableSlots(day)

      expect(result.success).toBe(true)

      if (result.success)
        expect(result.value).toEqual([
          {
            startTime: new Date(new Date(day).setHours(0)),
            endTime: new Date(new Date(day).setHours(1)),
          },
          {
            startTime: new Date(new Date(day).setHours(2)),
            endTime: new Date(new Date(day).setHours(3)),
          },
          {
            startTime: new Date(new Date(day).setHours(6)),
            endTime: new Date(new Date(day).setHours(23, 59, 59, 999)),
          },
        ])
    })

    test('works correctly for blocks on the day boundaries', async () => {
      const day = new Date(2024, 0, 3)

      const timeBlocks: TimeBlockDTO[] = [
        {
          id: 'existing-id-1',
          taskId: 'task-1',
          startTime: new Date(day).setHours(0),
          endTime: new Date(day).setHours(2),
          createdAt: new Date('2023-01-01T14:30:00').getTime(),
          rescheduledTimes: 1,
        },
        {
          id: 'existing-id-2',
          taskId: 'task-2',
          startTime: new Date(day).setHours(18),
          endTime: new Date(day).setHours(23, 59, 59, 999),
          createdAt: new Date('2023-01-01T14:30:00').getTime(),
          rescheduledTimes: 1,
        },
      ]

      vi.mocked(mockTimeBlockRepository.findAllWithin).mockResolvedValue(timeBlocks)

      const result = await plannerService.findAvailableSlots(day)

      expect(result.success).toBe(true)

      if (result.success)
        expect(result.value).toEqual([
          {
            startTime: new Date(new Date(day).setHours(2)),
            endTime: new Date(new Date(day).setHours(18)),
          },
        ])
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
