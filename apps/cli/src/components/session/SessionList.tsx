import { SessionListItem } from '@planning-system/cli-adapter'
import { useEffect, useState } from 'react'
import { cliAdapter } from '../../cli.js'
import { VirtualList } from '../ui/VirtualList.js'
import { SessionRenderer } from './SessionRenderer.js'
import { useNavigation } from '../navigation/NavigationContext.js'
import { usePopResult } from '../navigation/usePopResult.js'
import { useErrors } from '../error-handling/ErrorsContext.js'

export function SessionList() {
  const [sessionItems, setSessionItems] = useState<SessionListItem[]>([])
  const { push } = useNavigation()
  const popResult = usePopResult('SessionList')

  const { addError } = useErrors()

  useEffect(() => {
    const findAllTasks = async () => {
      const result = await cliAdapter.findAllSessionsListItems()

      if (result.success) setSessionItems(result.value)
      else addError(result.error)
    }

    findAllTasks()
  }, [addError])

  return (
    <VirtualList
      data={sessionItems}
      renderItem={({ item, index, isSelected, isVisible }) => (
        <SessionRenderer index={index} isSelected={isSelected} isVisible={isVisible} item={item} />
      )}
      additionalHints={[{ keys: 'm', description: 'В главное меню' }]}
      onSelect={(session) => {
        push({ name: 'Session', params: { sessionId: session.id } })
      }}
      initialSelectedId={popResult?.sessionId}
    />
  )
}
