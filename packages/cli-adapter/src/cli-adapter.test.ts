import { describe, test, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CLIAdapter } from './cli-adapter.js'
import { PlannerService, FetchSessionDetailsUseCase } from '@planning-system/core'

vi.mock('@planning-system/core', async () => {
  const actual = await vi.importActual('@planning-system/core')
  return {
    ...actual,
    FetchSessionDetailsUseCase: vi.fn(),
  }
})

describe('CLIAdapter.showAvailableSlots', () => {
  let mockPlannerService: PlannerService
  let adapter: CLIAdapter

  const mockTaskRepo = {} as never
  const mockTimeBlockRepo = {} as never
  const mockSessionRepo = {} as never
  const mockUserActionsService = {} as never
  const mockTimeTrackingService = {} as never
  const mockTaskService = {} as never

  const fakeNow = new Date('2025-03-20T12:00:00Z')

  beforeEach(() => {
    process.env.TZ = 'Europe/Moscow'
    vi.useFakeTimers()
    vi.setSystemTime(fakeNow)

    mockPlannerService = {
      findAvailableSlots: vi.fn(),
      isLastDayToSchedule: vi.fn(),
    } as unknown as PlannerService

    adapter = new CLIAdapter(
      mockTaskRepo,
      mockTimeBlockRepo,
      mockSessionRepo,
      mockUserActionsService,
      mockPlannerService as PlannerService,
      mockTimeTrackingService,
      mockTaskService
    )
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

  test('should return a full-day slot when no timeblocks are booked', async () => {
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

  test('if isLastDayToSchedule = true, then hasNextDay = false', async () => {
    const parsedDate = new Date('2025-03-21T21:00:00Z')
    vi.spyOn(adapter, 'parseDay').mockReturnValue({ success: true, value: parsedDate })

    const mockSlots = [
      { startTime: new Date('2025-03-21T21:00:00Z'), endTime: new Date('2025-03-22T21:00:00Z') },
    ]

    vi.mocked(mockPlannerService.findAvailableSlots).mockResolvedValue({
      success: true,
      value: mockSlots,
    })

    vi.mocked(mockPlannerService.isLastDayToSchedule).mockReturnValue(true)

    const result = await adapter.showAvailableSlots('22.03.2025')

    expect(result.success).toBe(true)

    if (result.success) expect(result.value.hasNextDay).toBe(false)

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

describe('CLIAdapter.fetchSessionDetails', () => {
  // Mock dependencies (only need to satisfy the constructor)
  const mockTaskRepo = {} as never
  const mockTimeBlockRepo = {} as never
  const mockSessionRepo = {} as never
  const mockUserActionsService = {} as never
  const mockPlannerService = {} as never
  const mockTimeTrackingService = {} as never
  const mockTaskService = {} as never

  let adapter: CLIAdapter
  let mockFetchSessionDetailsExecute: ReturnType<typeof vi.fn>

  beforeEach(() => {
    process.env.TZ = 'Europe/Moscow' // UTC+3
    vi.useFakeTimers()

    adapter = new CLIAdapter(
      mockTaskRepo,
      mockTimeBlockRepo,
      mockSessionRepo,
      mockUserActionsService,
      mockPlannerService,
      mockTimeTrackingService,
      mockTaskService
    )

    mockFetchSessionDetailsExecute = vi.fn()
    // Use a regular function (not an arrow function) to be constructible
    vi.mocked(FetchSessionDetailsUseCase).mockImplementation(function () {
      return { execute: mockFetchSessionDetailsExecute }
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should return formatted session details on success with all fields', async () => {
    const sessionId = 'session-123'
    const mockUseCaseResult = {
      success: true,
      value: {
        id: sessionId,
        startTime: new Date('2023-10-01T10:00:00.000Z'),
        endTime: new Date('2023-10-01T12:30:00.000Z'),
        timeBlock: {
          startTime: new Date('2023-10-01T10:00:00.000Z'),
          endTime: new Date('2023-10-01T12:00:00.000Z'),
        },
        intervals: [
          {
            type: 'work',
            startTime: '2023-10-01T10:00:00.000Z',
            endTime: '2023-10-01T11:00:00.000Z',
          },
          {
            type: 'break',
            startTime: '2023-10-01T11:00:00.000Z',
            endTime: '2023-10-01T11:15:00.000Z',
          },
          {
            type: 'work',
            startTime: '2023-10-01T11:15:00.000Z',
            endTime: '2023-10-01T12:30:00.000Z',
          },
        ],
      },
    }

    mockFetchSessionDetailsExecute.mockResolvedValue(mockUseCaseResult)

    const result = await adapter.fetchSessionDetails(sessionId)

    expect(result.success).toBe(true)
    if (result.success)
      expect(result.value).toEqual({
        ...mockUseCaseResult.value,
        formated: {
          startTime: '13:00', // 10:00 UTC → 13:00 MSK
          endTime: '15:30', // 12:30 UTC → 15:30 MSK
          timeBlock: '13:00-15:00', // 10:00-12:00 UTC → 13:00-15:00 MSK
          intervals: ['13:00-14:00', '14:15-15:30'],
          lastWorkIntervalStart: '14:15', // 11:15 UTC → 14:15 MSK
        },
      })
  })

  it('should handle missing timeBlock', async () => {
    const sessionId = 'session-123'
    const mockUseCaseResult = {
      success: true,
      value: {
        id: sessionId,
        startTime: new Date('2023-10-01T10:00:00.000Z'),
        endTime: new Date('2023-10-01T12:30:00.000Z'),
        timeBlock: null,
        intervals: [
          {
            type: 'work',
            startTime: '2023-10-01T10:00:00.000Z',
            endTime: '2023-10-01T12:30:00.000Z',
          },
        ],
      },
    }

    mockFetchSessionDetailsExecute.mockResolvedValue(mockUseCaseResult)

    const result = await adapter.fetchSessionDetails(sessionId)

    expect(result.success).toBe(true)
    if (result.success) expect(result.value.formated.timeBlock).toBeNull()
  })

  it('should handle ongoing session with null endTime', async () => {
    const sessionId = 'session-123'
    const mockUseCaseResult = {
      success: true,
      value: {
        id: sessionId,
        startTime: new Date('2023-10-01T10:00:00.000Z'),
        endTime: null,
        timeBlock: {
          startTime: new Date('2023-10-01T10:00:00.000Z'),
          endTime: new Date('2023-10-01T12:00:00.000Z'),
        },
        intervals: [{ type: 'work', startTime: '2023-10-01T10:00:00.000Z', endTime: null }],
      },
    }

    mockFetchSessionDetailsExecute.mockResolvedValue(mockUseCaseResult)

    const result = await adapter.fetchSessionDetails(sessionId)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.value.formated.endTime).toBeNull()
      expect(result.value.formated.intervals).toEqual(['13:00-?'])
      expect(result.value.formated.lastWorkIntervalStart).toEqual('13:00')
    }
  })

  it('should only include work intervals in formatted intervals', async () => {
    const sessionId = 'session-123'
    const mockUseCaseResult = {
      success: true,
      value: {
        id: sessionId,
        startTime: new Date('2023-10-01T10:00:00.000Z'),
        endTime: new Date('2023-10-01T14:00:00.000Z'),
        timeBlock: null,
        intervals: [
          {
            type: 'work',
            startTime: '2023-10-01T10:00:00.000Z',
            endTime: '2023-10-01T11:00:00.000Z',
          },
          {
            type: 'break',
            startTime: '2023-10-01T11:00:00.000Z',
            endTime: '2023-10-01T11:30:00.000Z',
          },
          {
            type: 'work',
            startTime: '2023-10-01T11:30:00.000Z',
            endTime: '2023-10-01T12:30:00.000Z',
          },
          {
            type: 'work',
            startTime: '2023-10-01T12:30:00.000Z',
            endTime: '2023-10-01T13:30:00.000Z',
          },
          {
            type: 'other',
            startTime: '2023-10-01T13:30:00.000Z',
            endTime: '2023-10-01T14:00:00.000Z',
          },
        ],
      },
    }

    mockFetchSessionDetailsExecute.mockResolvedValue(mockUseCaseResult)

    const result = await adapter.fetchSessionDetails(sessionId)

    if (result.success)
      expect(result.value.formated.intervals).toEqual([
        '13:00-14:00', // 10:00-11:00 UTC
        '14:30-15:30', // 11:30-12:30 UTC
        '15:30-16:30', // 12:30-13:30 UTC
      ])
  })

  it('should return failure result when use case fails', async () => {
    const sessionId = 'invalid-id'
    const mockUseCaseResult = {
      success: false,
      error: 'Session not found',
    }

    mockFetchSessionDetailsExecute.mockResolvedValue(mockUseCaseResult)

    const result = await adapter.fetchSessionDetails(sessionId)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe('Session not found')
  })
})
