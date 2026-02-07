import { Box, Text } from 'ink'
import { RenderItemProps } from '../ui/VirtualList.js'
import { TaskFields } from '../menu/NewTaskMenu.js'

export function TaskRenderer<T extends TaskFields>({
  item: task,
  index,
  isSelected,
}: RenderItemProps<T>) {
  return (
    <Box paddingX={1} paddingY={0}>
      <Text color={isSelected ? 'white' : 'gray'}>{String(index + 1).padStart(4, '0')}</Text>
      <Text> | </Text>
      <Text color={isSelected ? 'white' : undefined}>{task.title || `Item ${index + 1}`}</Text>
      {task.scheduledAt && (
        <>
          <Text> | Запланировано на: </Text>
          <Text color="green" dimColor>
            [{task.scheduledAt}]
          </Text>
        </>
      )}
    </Box>
  )
}
