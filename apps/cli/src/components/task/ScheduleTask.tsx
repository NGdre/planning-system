import { Box, Text, useInput } from 'ink'
import SelectInput from 'ink-select-input'
import { useState } from 'react'
import { cliAdapter } from '../../cli.js'
import { AvailableSlots, useDayOffset } from '../time-block/AvailableSlots.js'
import { DateTime } from '../ui/DateTime.js'
import { ErrorMessage } from '../ui/ErrorMessage.js'
import PromptWithHints from '../ui/PromptWithHints.js'
import { useNavigation } from '../navigation/NavigationContext.js'

const MENU_ITEMS = [
  { value: 'PREV_DAY', label: 'Предыдущий день' },
  { value: 'NEXT_DAY', label: 'Следующий день' },
  { value: 'MANUAL_DAY', label: 'Ввести день вручную' },
  { value: 'TIME_BLOCK', label: 'Выбрать блок времени' },
  { value: 'DONE', label: 'Готово!' },
]

export interface ScheduleTaskProps {
  params: { taskId: string }
}

export function ScheduleTask({ params }: ScheduleTaskProps) {
  const [manualDayInput, setManualDayInput] = useState('')
  const [isScheduled, setIsScheduled] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isPromptActive, setIsPromptActive] = useState(false)
  const [timeBlockInput, setTimeBlockInput] = useState('')
  const [activePromptType, setActivePromptType] = useState<'TIME_BLOCK' | 'MANUAL_DAY' | null>(null)
  const { dayOffset, setDayOffset } = useDayOffset()
  const { push } = useNavigation()
  const { taskId } = params

  useInput((_input, key) => {
    if (key.return && isScheduled) {
      push({ name: 'TaskMenu', params: { taskId } })
    }
  })

  const handleScheduleTask = async () => {
    const [startTime, endTime] = timeBlockInput.split('-')
    if (!taskId) return

    const result = await cliAdapter.schedule(taskId, `r${dayOffset}`, startTime, endTime)
    if (result.success) {
      setIsScheduled(true)
    } else {
      setErrorMessage(result.error)
    }
  }

  const handleMenuSelect = (item: (typeof MENU_ITEMS)[number]) => {
    switch (item.value) {
      case 'PREV_DAY':
        setDayOffset(dayOffset - 1)
        break
      case 'NEXT_DAY':
        setDayOffset(dayOffset + 1)
        break
      case 'TIME_BLOCK':
        setIsPromptActive(true)
        setActivePromptType('TIME_BLOCK')
        break
      case 'MANUAL_DAY':
        setIsPromptActive(true)
        setActivePromptType('MANUAL_DAY')
        break
      case 'DONE':
        handleScheduleTask()
        break
    }
  }

  if (isScheduled) {
    return (
      <Box flexDirection="column">
        <Text>Задача запланирована!</Text>
        <Text>Нажмите Enter, чтобы вернуться в к задаче</Text>
      </Box>
    )
  }

  if (isPromptActive) {
    return (
      <Box flexDirection="column">
        {activePromptType === 'MANUAL_DAY' && (
          <PromptWithHints
            value={manualDayInput}
            onChange={setManualDayInput}
            label="Введите день: "
            onSubmit={() => {
              const parsedDay = cliAdapter.parseDayToRelative(manualDayInput)
              if (parsedDay.success) {
                setDayOffset(parsedDay.value)
                setManualDayInput('')
                setIsPromptActive(false)
              } else {
                setErrorMessage(parsedDay.error)
              }
            }}
          />
        )}

        {activePromptType === 'TIME_BLOCK' && (
          <PromptWithHints
            value={timeBlockInput}
            onChange={setTimeBlockInput}
            label="Введите блок времени: "
            onSubmit={() => {
              setIsPromptActive(false)
            }}
          />
        )}

        {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      {timeBlockInput && (
        <Text>
          Блок времени: <DateTime>{timeBlockInput}</DateTime>
        </Text>
      )}
      <AvailableSlots dayOffset={dayOffset} onError={setErrorMessage} />
      <SelectInput items={MENU_ITEMS} onSelect={handleMenuSelect} />
      {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
    </Box>
  )
}
