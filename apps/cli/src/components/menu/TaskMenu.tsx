import { TaskDetails } from '@planning-system/cli-adapter'
import { TaskAction } from '@planning-system/core'
import { Box, Text } from 'ink'
import SelectInput from 'ink-select-input'
import { useEffect, useState } from 'react'
import { cliAdapter } from '../../cli.js'
import { DateTime } from '../ui/DateTime.js'
import { useNavigation } from '../navigation/NavigationContext.js'

const selectTaskMenuItems = (taskDetails: TaskDetails | null) => {
  if (!taskDetails) return []

  const availableActions = taskDetails.taskActions

  const allTaskMenuItems = [
    {
      label: 'Начать задачу',
      value: TaskAction.START,
    },
    {
      label: 'Редактировать',
      value: TaskAction.EDIT,
    },
    {
      label:
        taskDetails.status === 'scheduled'
          ? 'Перенести запланированое время'
          : 'Запланировать время',
      value: TaskAction.SCHEDULE,
    },
    {
      label: 'Отменить',
      value: TaskAction.CANCEL,
    },
    {
      label: 'Удалить',
      value: TaskAction.DELETE,
    },
    {
      label: 'Завершить',
      value: TaskAction.COMPLETE,
    },
  ]

  return allTaskMenuItems.filter((item) => availableActions.includes(item.value))
}

export interface TaskProps {
  params: { taskId: string; allowBack?: boolean }
}

export default function TaskMenu({ params }: TaskProps) {
  const { push } = useNavigation()
  const [taskDetails, setTaskDetails] = useState<TaskDetails | null>(null)
  const { goHome, pop } = useNavigation()

  const { taskId, allowBack = true } = params

  useEffect(() => {
    const fetchTaskDetails = async () => {
      if (taskId !== null) {
        const result = await cliAdapter.getSpecificTask(taskId)
        if (result.success) setTaskDetails(result.value)
      }
    }

    fetchTaskDetails()
  }, [taskId])

  const handleSelect = async (item: { label: string; value: string }) => {
    if (item.value === TaskAction.SCHEDULE) {
      push({ name: 'ScheduleTask', params: { taskId } })
    }

    if (item.value === TaskAction.START) {
      if (taskId) {
        const result = await cliAdapter.startTaskSession(taskId)

        if (result.success) push({ name: 'Session', params: {} })
      }
    }

    if (item.value === 'BACK') pop()
    if (item.value === 'HOME') goHome()
  }

  const actions = [
    ...selectTaskMenuItems(taskDetails),
    ...(allowBack ? [{ value: 'BACK', label: 'Назад' }] : []),
    {
      value: 'HOME',
      label: 'В главное меню',
    },
  ]

  return (
    <>
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color={'blueBright'}>
          <Text color={'gray'}>Задача: </Text>
          {taskDetails?.title}
        </Text>
        <Text dimColor color={'cyan'}>
          Статус: {taskDetails?.status}
        </Text>
        {taskDetails?.day && <DateTime>{taskDetails.day}</DateTime>}
        {taskDetails?.timeBlock && <DateTime>{taskDetails.timeBlock}</DateTime>}
      </Box>
      <SelectInput items={actions} onSelect={handleSelect} />
    </>
  )
}
