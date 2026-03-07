import { SessionListItem } from '@planning-system/cli-adapter'
import { useEffect, useState } from 'react'
import { cliAdapter } from '../../cli.js'
import { WithNavigationKeys } from '../router/Router.js'
import { VirtualList } from '../ui/VirtualList.js'
import { SessionRenderer } from './SessionRenderer.js'

export function SessionList() {
  const [sessionItems, setSessionItems] = useState<SessionListItem[]>([])

  useEffect(() => {
    const findAllTasks = async () => {
      const result = await cliAdapter.findAllSessionsListItems()

      if (result.success) setSessionItems(result.value)
    }

    findAllTasks()
  }, [])

  return (
    <WithNavigationKeys>
      <VirtualList
        data={sessionItems}
        renderItem={({ item, index, isSelected, isVisible }) => (
          <SessionRenderer
            index={index}
            isSelected={isSelected}
            isVisible={isVisible}
            item={item}
          />
        )}
        additionalHints={[
          { keys: 'b', description: 'Назад' },
          { keys: 'm', description: 'В главное меню' },
        ]}
      />
    </WithNavigationKeys>
  )
}
