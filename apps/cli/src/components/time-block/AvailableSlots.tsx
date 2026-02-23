import { useEffect, useState } from 'react'
import { cliAdapter } from '../../cli.js'
import { Box, Text } from 'ink'
import { DateTime } from '../ui/DateTime.js'

interface AvailableSlotsProps {
  onError?: (err: string) => void
  relativeDay: number
}

export function usePagination() {
  const [page, setPage] = useState(0)

  const handleSetPage = (pageInput: number) => {
    if (pageInput >= 0 && pageInput < 30) {
      setPage(pageInput)
    }
  }

  return {
    page,
    setPage: handleSetPage,
  }
}

export function AvailableSlots({ onError, relativeDay = 0 }: AvailableSlotsProps) {
  const [slots, setSlots] = useState<string[]>([])
  const [selectedDay, setSelectedDay] = useState<string>('')

  useEffect(() => {
    const handleDayChange = async () => {
      const now = new Date()

      now.setDate(now.getDate() + relativeDay)

      const result = await cliAdapter.showAvailableSlots(`r${relativeDay}`)

      if (result.success) {
        setSlots(result.value.slots)
        setSelectedDay(result.value.formatedDay)
      } else {
        onError?.(result.error)
      }
    }

    handleDayChange()
  }, [relativeDay])

  return (
    <>
      <Box marginBottom={1}>
        <Text>
          Выбранный день: <DateTime>{selectedDay}</DateTime>
        </Text>
      </Box>
      {slots.length > 0 && (
        <Box flexDirection="column" marginBottom={1}>
          <Text>Свободные слоты:</Text>

          {slots.map((slot) => (
            <DateTime key={slot}>{slot}</DateTime>
          ))}
        </Box>
      )}
    </>
  )
}
