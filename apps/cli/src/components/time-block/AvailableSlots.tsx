import { Box, Text } from 'ink'
import { useEffect, useState } from 'react'
import { cliAdapter } from '../../cli.js'
import { DateTime } from '../ui/DateTime.js'

interface AvailableSlotsProps {
  onError?: (err: string) => void
  dayOffset: number
}

export function useDayOffset() {
  const [dayOffset, setDayOffset] = useState(0)

  const setValidatedDayOffset = (offset: number) => {
    if (offset >= 0 && offset < 30) {
      setDayOffset(offset)
    }
  }

  return { dayOffset, setDayOffset: setValidatedDayOffset }
}

export function AvailableSlots({ onError, dayOffset = 0 }: AvailableSlotsProps) {
  const [slots, setSlots] = useState<string[]>([])
  const [selectedDay, setSelectedDay] = useState<string>('')

  useEffect(() => {
    const fetchSlots = async () => {
      const result = await cliAdapter.showAvailableSlots(`r${dayOffset}`)
      if (result.success) {
        setSlots(result.value.slots)
        setSelectedDay(result.value.formatedDay)
      } else {
        onError?.(result.error)
      }
    }

    fetchSlots()
  }, [dayOffset, onError])

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
