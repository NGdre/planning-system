import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { CLIAdapter } from './cli-adapter.js'
import { PlannerService } from '@planning-system/core'

const mockTaskRepo = {} as never
const mockTimeBlockRepo = {} as never
const mockUserActionsService = {} as never

describe('CLIAdapter.showAvailableSlots', () => {
  let mockPlannerService: PlannerService
  let adapter: CLIAdapter

  const fakeNow = new Date('2025-03-20T12:00:00Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(fakeNow)

    mockPlannerService = {
      findAvailableSlots: vi.fn(),
      isLastDayToSchedule: vi.fn(),
    } as unknown as PlannerService

    adapter = new CLIAdapter(
      mockTaskRepo,
      mockTimeBlockRepo,
      mockUserActionsService,
      mockPlannerService as PlannerService
    )

    adapter.userTimeZone = 'Europe/Moscow'
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  test('should return formatted slots if parsing is successful and slots are available', async () => {
    const parsedDate = new Date('2025-03-20T00:00:00Z')
    vi.spyOn(adapter, 'parseDay').mockReturnValue({ success: true, value: parsedDate })

    const mockSlots = [
      { startTime: new Date('2025-03-20T14:00:00Z'), endTime: new Date('2025-03-20T16:00:00Z') },
      { startTime: new Date('2025-03-20T17:00:00Z'), endTime: new Date('2025-03-20T18:00:00Z') },
    ]

    vi.mocked(mockPlannerService.findAvailableSlots).mockResolvedValue({
      success: true,
      value: mockSlots,
    })

    vi.mocked(mockPlannerService.isLastDayToSchedule).mockReturnValue(false)

    const result = await adapter.showAvailableSlots('20.03.2025')

    expect(result.success).toBe(true)

    if (result.success)
      expect(result.value).toEqual({
        slots: ['17:00-19:00', '20:00-21:00'],
        hasPrevDay: false,
        hasNextDay: true,
      })

    expect(mockPlannerService.findAvailableSlots).toHaveBeenCalledWith(
      fakeNow,
      new Date('2025-03-20T21:00:00Z')
    )
    expect(mockPlannerService.isLastDayToSchedule).toHaveBeenCalledWith(parsedDate)
  })

  test("when there's no timeblocks for given day", async () => {
    const parsedDate = new Date('2025-03-21T21:00:00Z')
    vi.spyOn(adapter, 'parseDay').mockReturnValue({ success: true, value: parsedDate })

    const mockSlots = [
      { startTime: new Date('2025-03-21T21:00:00Z'), endTime: new Date('2025-03-22T21:00:00Z') },
    ]

    vi.mocked(mockPlannerService.findAvailableSlots).mockResolvedValue({
      success: true,
      value: mockSlots,
    })

    vi.mocked(mockPlannerService.isLastDayToSchedule).mockReturnValue(false)

    const result = await adapter.showAvailableSlots('22.03.2025')

    expect(result.success).toBe(true)

    if (result.success)
      expect(result.value).toEqual({
        slots: ['00:00-24:00'],
        hasPrevDay: true,
        hasNextDay: true,
      })

    expect(mockPlannerService.findAvailableSlots).toHaveBeenCalledWith(
      parsedDate,
      new Date('2025-03-22T21:00:00Z')
    )
    expect(mockPlannerService.isLastDayToSchedule).toHaveBeenCalledWith(parsedDate)
  })

  test('must handle the case where findAvailableSlots returns an empty array', async () => {
    vi.spyOn(adapter, 'parseDay').mockReturnValue({ success: true, value: new Date('2025-03-20') })
    vi.mocked(mockPlannerService.findAvailableSlots).mockResolvedValue({
      success: true,
      value: [],
    })
    vi.mocked(mockPlannerService.isLastDayToSchedule).mockReturnValue(false)

    const result = await adapter.showAvailableSlots('20.03.2025')

    expect(result.success).toBe(true)
    if (result.success) expect(result.value.slots).toEqual([])
  })

  test('should return an error if parseDay returned an error', async () => {
    const errorResult = { success: false, error: 'the day does not match the format' } as const
    vi.spyOn(adapter, 'parseDay').mockReturnValue(errorResult)

    const result = await adapter.showAvailableSlots('invalid-date')

    expect(result).toEqual(errorResult)
    expect(mockPlannerService.findAvailableSlots).not.toHaveBeenCalled()
  })

  test('should throw an error from findAvailableSlots (use case)', async () => {
    vi.spyOn(adapter, 'parseDay').mockReturnValue({ success: true, value: new Date('2025-03-20') })
    const errorResult = { success: false, error: 'Database error' } as const
    vi.mocked(mockPlannerService.findAvailableSlots).mockResolvedValue(errorResult)

    const result = await adapter.showAvailableSlots('20.03.2025')

    expect(result).toEqual(errorResult)
    expect(mockPlannerService.isLastDayToSchedule).not.toHaveBeenCalled()
  })
})
