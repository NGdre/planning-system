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

        expect(result).toBe(false)
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

      expect(result).toBe(false)
      expect(mockTimeBlockRepository.findAllWithin).toHaveBeenCalled()
      expect(mockTimeBlockRepository.save).toHaveBeenCalledTimes(0)
    })

    test('должен возвращать true при успешном планировании и сохранять блок', async () => {
      const now = new Date('2024-01-01T10:00:00')
      vi.setSystemTime(now)

      const startTime = new Date('2024-01-01T14:00:00')
      const endTime = new Date('2024-01-01T15:00:00')

      vi.mocked(mockIdGenerator).mockReturnValue('generated-id-1')
      vi.mocked(mockTimeBlockRepository.findAllWithin).mockResolvedValue([])

      const result = await plannerService.schedule('task-1', startTime, endTime)

      const desiredTimeBlock = TimeBlockEntity.create(mockIdGenerator, {
        taskId: 'task-1',
        startTime,
        endTime,
      })

      expect(result).toBe(true)
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

  describe('getBusyTimeBlocks', () => {
    test.each([
      {
        dayDate: '2024-01-01',
        expectedStartDate: '2024-01-01T12:30:00',
        description: 'on the same day',
      },
      {
        dayDate: '2024-01-02',
        expectedStartDate: '2024-01-02T00:00:00',
        description: 'on a different day',
      },
    ])(
      'should return correct busy time blocks: $description',
      async ({ dayDate, expectedStartDate }) => {
        const mockDate = new Date('2024-01-01T12:30:00')
        vi.setSystemTime(mockDate)

        const day = new Date(dayDate)
        const expectedStartTime = new Date(expectedStartDate).getTime()

        const msInDay = 24 * 60 * 60 * 1000
        const expectedEndTime = expectedStartTime + msInDay

        const mockBusyBlocks: TimeBlockDTO[] = [
          {
            id: '1',
            taskId: 'task-1',
            startTime: expectedStartTime + 1000,
            endTime: expectedStartTime + 2000,
            createdAt: expectedStartTime - 1000,
            rescheduledTimes: 0,
          },
          {
            id: '2',
            taskId: 'task-2',
            startTime: expectedStartTime + msInDay / 2,
            endTime: expectedStartTime + msInDay,
            createdAt: expectedStartTime - 1000,
            rescheduledTimes: 0,
          },
        ]

        vi.mocked(mockTimeBlockRepository.findAllWithin).mockResolvedValue(mockBusyBlocks)

        const result = await plannerService.getBusyTimeBlocks(day)

        expect(result).toEqual(mockBusyBlocks)
        expect(mockTimeBlockRepository.findAllWithin).toHaveBeenCalledWith(
          expectedStartTime,
          expectedEndTime
        )
      }
    )

    test('должен корректно работать в конце дня', async () => {
      const mockDate = new Date('2024-01-01T23:59:00')
      vi.setSystemTime(mockDate)

      const day = new Date('2024-01-01')

      await plannerService.getBusyTimeBlocks(day)

      const expectedStartTime = mockDate.getTime()
      const expectedEndTime = expectedStartTime + 24 * 60 * 60 * 1000

      expect(mockTimeBlockRepository.findAllWithin).toHaveBeenCalledWith(
        expectedStartTime,
        expectedEndTime
      )
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
