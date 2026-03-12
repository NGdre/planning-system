import { TaskDetails } from '@planning-system/cli-adapter'
import { TaskAction } from '@planning-system/core'
import { Box, Text } from 'ink'
import SelectInput from 'ink-select-input'
import { useEffect, useState } from 'react'
import { cliAdapter } from '../../cli.js'
import { useTaskStore } from '../task/TaskStore.js'
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

export default function TaskMenu() {
  const { push } = useNavigation()
  const { selectedTaskId } = useTaskStore()
  const [taskDetails, setTaskDetails] = useState<TaskDetails | null>(null)

  useEffect(() => {
    const fetchTaskDetails = async () => {
      if (selectedTaskId !== null) {
        const result = await cliAdapter.getSpecificTask(selectedTaskId)
        if (result.success) setTaskDetails(result.value)
      }
    }

    fetchTaskDetails()
  }, [selectedTaskId])

  const handleSelect = async (item: { label: string; value: TaskAction }) => {
    if (item.value === TaskAction.SCHEDULE) {
      push({ name: 'ScheduleTask' })
    }

    if (item.value === TaskAction.START) {
      if (selectedTaskId) {
        const result = await cliAdapter.startTaskSession(selectedTaskId)

        if (result.success) push({ name: 'Session', params: {} })
      }
    }
  }

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
      <SelectInput items={selectTaskMenuItems(taskDetails)} onSelect={handleSelect} />
    </>
  )
}
