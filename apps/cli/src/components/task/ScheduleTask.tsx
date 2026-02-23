import { Box, Text, useInput } from 'ink'
import { useState } from 'react'
import { cliAdapter } from '../../cli.js'
import { ErrorMessage } from '../ui/ErrorMessage.js'
import { useTaskStore } from './TaskStore.js'
import { AvailableSlots, usePagination } from '../time-block/AvailableSlots.js'
import SelectInput from 'ink-select-input'
import PromptWithHints from '../ui/PromptWithHints.js'
import { useRouter } from '../router/Router.js'
import { DateTime } from '../ui/DateTime.js'

export function ScheduleTask() {
  const { selectedTaskId } = useTaskStore()
  const [dayInput, setDayInput] = useState<string>('')
  const [isScheduled, setIsScheduled] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [timeBlockInput, setTimeBlockInput] = useState('')
  const [promptName, setPromptName] = useState<'TIME_BLOCK' | 'MANUAL_DAY' | null>(null)
  const { page, setPage } = usePagination()
  const { navigate } = useRouter()

  useInput((_input, key) => {
    if (key.return && isScheduled) {
      navigate('main')
    }
  })

  const handleScheduleTask = async () => {
    const [startTime, endTime] = timeBlockInput.split('-')

    if (selectedTaskId) {
      const result = await cliAdapter.schedule(selectedTaskId, `r${page}`, startTime, endTime)

      if (result.success) {
        setIsScheduled(true)
      } else {
        setErrorMessage(result.error)
      }
    }
  }

  const menu = [
    {
      value: 'PREV_DAY',
      label: 'Предыдущий день',
    },
    {
      value: 'NEXT_DAY',
      label: 'Следующий день',
    },
    {
      value: 'MANUAL_DAY',
      label: 'Ввести день вручную',
    },
    {
      value: 'TIME_BLOCK',
      label: 'Выбрать блок времени',
    },
    {
      value: 'DONE',
      label: 'Готово!',
    },
  ]

  const handleMenuSelect = (item: { value: string; label: string }) => {
    if (item.value === 'PREV_DAY') setPage(page - 1)
    if (item.value === 'NEXT_DAY') setPage(page + 1)
    if (item.value === 'TIME_BLOCK') {
      setIsEditing(true)
      setPromptName('TIME_BLOCK')
    }
    if (item.value === 'MANUAL_DAY') {
      setIsEditing(true)
      setPromptName('MANUAL_DAY')
    }
    if (item.value === 'DONE') {
      handleScheduleTask()
    }
  }

  if (isScheduled)
    return (
      <Box flexDirection="column">
        <Text>Задача запланирована!</Text>
        <Text>Нажмите Enter, чтобы вернуться в главное меню</Text>
      </Box>
    )

  if (isEditing)
    return (
      <Box flexDirection="column">
        {promptName === 'MANUAL_DAY' && (
          <PromptWithHints
            value={dayInput}
            onChange={setDayInput}
            label="Введите день: "
            onSubmit={() => {
              const parsedDay = cliAdapter.parseDayToRelative(dayInput)

              if (parsedDay.success) {
                setPage(parsedDay.value)
                setDayInput('')
                setIsEditing(false)
              } else {
                setErrorMessage(parsedDay.error)
              }
            }}
          />
        )}

        {promptName === 'TIME_BLOCK' && (
          <PromptWithHints
            value={timeBlockInput}
            onChange={setTimeBlockInput}
            label="Введите блок времени: "
            onSubmit={() => {
              setIsEditing(false)
            }}
          />
        )}

        {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
      </Box>
    )

  return (
    <Box flexDirection="column">
      {timeBlockInput && (
        <Text>
          Блок времени:
          <DateTime>{timeBlockInput}</DateTime>
        </Text>
      )}
      <AvailableSlots relativeDay={page} onError={(err) => setErrorMessage(err)} />
      <SelectInput items={menu} onSelect={handleMenuSelect} />

      {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
    </Box>
  )
}
