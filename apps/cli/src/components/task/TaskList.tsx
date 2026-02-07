import { WithNavigationKeys } from '../router/Router.js'
import { VirtualList } from '../ui/VirtualList.js'
import { TaskRenderer } from './TaskRenderer.js'
import { useTaskStore } from './TaskStore.js'

export function TaskList() {
  const { tasks } = useTaskStore()

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
