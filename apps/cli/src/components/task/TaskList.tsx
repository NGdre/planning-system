import { TaskDTO } from '@planning-system/core'
import { useEffect, useState } from 'react'
import { cliAdapter } from '../../cli.js'
import { useRouter, WithNavigationKeys } from '../router/Router.js'
import { VirtualList } from '../ui/VirtualList.js'
import { TaskRenderer } from './TaskRenderer.js'
import { useTaskStore } from './TaskStore.js'

export function TaskList() {
  const [tasks, setTasks] = useState<TaskDTO[]>([])
  const { navigate } = useRouter()
  const { setSelectedTaskId } = useTaskStore()

  useEffect(() => {
    const findAllTasks = async () => {
      setTasks(await cliAdapter.listTasks())
    }

    findAllTasks()
  }, [])

  return (
    <WithNavigationKeys>
      <VirtualList
        data={tasks}
        renderItem={({ item, index, isSelected, isVisible }) => (
          <TaskRenderer index={index} isSelected={isSelected} isVisible={isVisible} item={item} />
        )}
        additionalHints=" | b - Назад"
        onSelect={(item) => {
          setSelectedTaskId(item.id)
          navigate('task-menu')
        }}
      />
    </WithNavigationKeys>
  )
}
