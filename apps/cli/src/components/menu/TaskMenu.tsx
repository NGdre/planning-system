import { TaskAction, TaskDetails } from '@planning-system/core'
import { Box, Text } from 'ink'
import SelectInput from 'ink-select-input'
import { useEffect, useState } from 'react'
import { cliAdapter } from '../../cli.js'
import { WithNavigationKeys } from '../router/Router.js'
import { useTaskStore } from '../task/TaskStore.js'

const selectTaskMenuItems = (availableActions: TaskAction[]) => {
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
      label: 'Запланировать время',
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
  const handleSelect = async () => {}
  const { selectedTaskId } = useTaskStore()
  const [taskDetails, setTaskDetails] = useState<TaskDetails | null>(null)

  useEffect(() => {
    const fetchTaskDetails = async () => {
      if (selectedTaskId !== null) setTaskDetails(await cliAdapter.getSpecificTask(selectedTaskId))
    }

    fetchTaskDetails()
  }, [selectedTaskId])

  return (
    <WithNavigationKeys>
      <Box flexDirection="column" marginBottom={1}>
        <Text bold color={'blueBright'}>
          <Text color={'gray'}>Задача: </Text>
          {taskDetails?.title}
        </Text>
        <Text dimColor color={'cyan'}>
          Статус: {taskDetails?.status}
        </Text>
      </Box>
      <SelectInput
        items={selectTaskMenuItems(taskDetails?.taskActions || [])}
        onSelect={handleSelect}
      />
    </WithNavigationKeys>
  )
}
