import { Box, Text } from 'ink'
import { RenderItemProps } from '../ui/VirtualList.js'
import { SessionListItem } from '@planning-system/cli-adapter'

export function SessionRenderer<T extends SessionListItem>({
  item: session,
  index,
  isSelected,
}: RenderItemProps<T>) {
  return (
    <Box paddingX={1} paddingY={0}>
      <Text color={isSelected ? 'white' : 'gray'}>{String(index + 1).padStart(4, '0')}</Text>
      <Text> | </Text>
      <Text color={isSelected ? 'white' : 'gray'}>Начало: {session.startTime}</Text>
      <Text> | </Text>
      {session.endTime && (
        <Text color={isSelected ? 'white' : 'gray'}>
          Конец:
          {session.endTime}
          <Text> | </Text>
        </Text>
      )}

      {session.taskTitle && (
        <Text color={isSelected ? 'white' : 'gray'}>
          {session.taskTitle}
          <Text> | </Text>
        </Text>
      )}

      <Text color={isSelected ? 'white' : 'gray'}>{session.totalWorkTime} мин</Text>
    </Box>
  )
}
