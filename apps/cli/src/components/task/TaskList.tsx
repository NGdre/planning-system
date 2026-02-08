import { useEffect, useState } from 'react'
import { WithNavigationKeys } from '../router/Router.js'
import { VirtualList } from '../ui/VirtualList.js'
import { TaskRenderer } from './TaskRenderer.js'
import { TaskDTO } from '@planning-system/core'
import { cliAdapter } from '../../cli.js'

export function TaskList() {
  const [tasks, setTasks] = useState<TaskDTO[]>([])

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
      />
    </WithNavigationKeys>
  )
}
