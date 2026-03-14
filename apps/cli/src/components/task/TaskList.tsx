import { TaskDTO } from '@planning-system/core'
import { useEffect, useState } from 'react'
import { cliAdapter } from '../../cli.js'
import { VirtualList } from '../ui/VirtualList.js'
import { TaskRenderer } from './TaskRenderer.js'
import { useNavigation } from '../navigation/NavigationContext.js'
import { usePopResult } from '../navigation/usePopResult.js'

export function TaskList() {
  const [tasks, setTasks] = useState<TaskDTO[]>([])
  const { push } = useNavigation()

  const popResult = usePopResult('TaskList')

  useEffect(() => {
    const findAllTasks = async () => {
      setTasks(await cliAdapter.listTasks())
    }

    findAllTasks()
  }, [])

  return (
    <VirtualList
      data={tasks}
      renderItem={({ item, index, isSelected, isVisible }) => (
        <TaskRenderer index={index} isSelected={isSelected} isVisible={isVisible} item={item} />
      )}
      additionalHints={[{ keys: 'm', description: 'В главное меню' }]}
      onSelect={(task) => {
        push({ name: 'TaskMenu', params: { taskId: task.id } })
      }}
      initialSelectedId={popResult?.taskId}
    />
  )
}
