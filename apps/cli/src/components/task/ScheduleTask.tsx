import { Box, Text } from 'ink'
import { useState } from 'react'
import { cliAdapter } from '../../cli.js'
import { TextInputContainer } from '../TextInputContainer.js'
import { DateTime } from '../ui/DateTime.js'
import { ErrorMessage } from '../ui/ErrorMessage.js'
import { useTaskStore } from './TaskStore.js'

export function ScheduleTask() {
  const { selectedTaskId } = useTaskStore()
  const [day, setDay] = useState<string>('')
  const [isScheduled, setIsScheduled] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [slots, setSlots] = useState<string[]>([])

  const handleDayChange = async (dayInput: string) => {
    const result = await cliAdapter.showAvailableSlots(dayInput)

    if (result.success) {
      setSlots(result.value.slots)
    } else {
      setErrorMessage(result.error)
    }

    setDay(dayInput)
  }

  const handleScheduleTask = async (timeBlockInput: string) => {
    const [startTime, endTime] = timeBlockInput.split('-')

    if (selectedTaskId) {
      const result = await cliAdapter.schedule(selectedTaskId, day, startTime, endTime)

      if (result.success) {
        setIsScheduled(true)
      } else {
        setErrorMessage(result.error)
      }
    }
  }

  return (
    <Box flexDirection="column">
      <TextInputContainer label="Введите день:" onSubmit={handleDayChange} hideOnSumbit />

      {day && (
        <>
          {slots.length > 0 && (
            <Box flexDirection="column" marginBottom={1}>
              <Text>Свободные слоты:</Text>

              {slots.map((slot) => (
                <DateTime key={slot}>{slot}</DateTime>
              ))}
            </Box>
          )}

          <TextInputContainer
            label="Введите блок времени:"
            onSubmit={handleScheduleTask}
            hideOnSumbit={isScheduled}
          />
        </>
      )}

      {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}

      {isScheduled && <Text>Задача запланирована!</Text>}
    </Box>
  )
}
