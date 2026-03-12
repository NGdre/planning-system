import { TaskDTO } from '@planning-system/core'
import { useEffect, useState } from 'react'
import { cliAdapter } from '../../cli.js'
import { VirtualList } from '../ui/VirtualList.js'
import { TaskRenderer } from './TaskRenderer.js'
import { useTaskStore } from './TaskStore.js'
import { useNavigation, useNavigationKeys } from '../navigation/NavigationContext.js'

export function TaskList() {
  const [tasks, setTasks] = useState<TaskDTO[]>([])
  const { push } = useNavigation()
  const { setSelectedTaskId } = useTaskStore()

  useEffect(() => {
    const findAllTasks = async () => {
      setTasks(await cliAdapter.listTasks())
    }

    findAllTasks()
  }, [])

  useNavigationKeys()

  return (
    <VirtualList
      data={tasks}
      renderItem={({ item, index, isSelected, isVisible }) => (
        <TaskRenderer index={index} isSelected={isSelected} isVisible={isVisible} item={item} />
      )}
      additionalHints={[
        { keys: 'b', description: 'Назад' },
        { keys: 'm', description: 'В главное меню' },
      ]}
      onSelect={(item) => {
        setSelectedTaskId(item.id)
        push({ name: 'TaskMenu' })
      }}
    />
  )
}
