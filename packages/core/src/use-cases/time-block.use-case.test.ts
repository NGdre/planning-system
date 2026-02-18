import { describe, test, expect, vi, beforeEach } from 'vitest'
import { ShowAvailableSlotsForDayUseCase } from './time-block.use-case.js'
import { PlannerService } from '../services/planner.service'
import { TimeBlock } from '../entities/time-block.entity'

describe('ShowAvailableSlotsForDayUseCase', () => {
  let plannerServiceMock: PlannerService
  let useCase: ShowAvailableSlotsForDayUseCase

  const mockSlots: TimeBlock[] = [
    { startTime: new Date('2025-03-20T10:00:00Z'), endTime: new Date('2025-03-20T12:00:00Z') },
    { startTime: new Date('2025-03-20T13:00:00Z'), endTime: new Date('2025-03-20T16:00:00Z') },
  ]

  beforeEach(() => {
    plannerServiceMock = {
      findAvailableSlots: vi.fn(),
      isLastDayToSchedule: vi.fn(),
    } as unknown as PlannerService

    useCase = new ShowAvailableSlotsForDayUseCase(plannerServiceMock)
  })

  test('should return slots for a day other than today', async () => {
    const day = new Date('2025-03-20T00:00:00Z')
    const now = new Date('2025-03-19T15:00:00Z')

    vi.mocked(plannerServiceMock.findAvailableSlots).mockResolvedValue({
      success: true,
      value: mockSlots,
    })

    vi.mocked(plannerServiceMock.isLastDayToSchedule).mockReturnValue(false)

    const result = await useCase.execute(day, now)

    expect(result.success).toBe(true)

    if (result.success)
      expect(result.value).toEqual({
        slots: mockSlots,
        hasPrevDay: true,
        hasNextDay: true,
      })

    expect(plannerServiceMock.findAvailableSlots).toHaveBeenCalledWith(
      day,
      new Date('2025-03-21T00:00:00Z')
    )
    expect(plannerServiceMock.isLastDayToSchedule).toHaveBeenCalledWith(day)
  })

  test('If the day matches now, then the search starts from now', async () => {
    const day = new Date('2025-03-20T00:00:00Z')
    const now = new Date('2025-03-20T10:30:00Z')

    vi.mocked(plannerServiceMock.findAvailableSlots).mockResolvedValue({
      success: true,
      value: mockSlots,
    })
    vi.mocked(plannerServiceMock.isLastDayToSchedule).mockReturnValue(false)

    const result = await useCase.execute(day, now)

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.value.hasPrevDay).toBe(false)
      expect(result.value.hasNextDay).toBe(true)
    }

    expect(plannerServiceMock.findAvailableSlots).toHaveBeenCalledWith(
      now,
      new Date('2025-03-20T24:00:00Z')
    )
  })

  test('if isLastDayToSchedule = true, then hasNextDay = false', async () => {
    const day = new Date('2025-03-20T00:00:00Z')
    const now = new Date('2025-03-19T10:00:00Z')

    vi.mocked(plannerServiceMock.findAvailableSlots).mockResolvedValue({
      success: true,
      value: mockSlots,
    })
    vi.mocked(plannerServiceMock.isLastDayToSchedule).mockReturnValue(true)

    const result = await useCase.execute(day, now)

    expect(result.success).toBe(true)
    if (result.success) expect(result.value.hasNextDay).toBe(false)
  })

  test('if findAvailableSlots returns an error, useCase should return it', async () => {
    const day = new Date('2025-03-20T00:00:00Z')
    const now = new Date('2025-03-19T10:00:00Z')
    const errorResult = { success: false, error: 'Something went wrong' } as const

    vi.mocked(plannerServiceMock.findAvailableSlots).mockResolvedValue(errorResult)

    const result = await useCase.execute(day, now)

    expect(result).toEqual(errorResult)
    expect(plannerServiceMock.isLastDayToSchedule).not.toHaveBeenCalled()
  })
})
