import { SessionListItem } from '@planning-system/cli-adapter'
import { useEffect, useState } from 'react'
import { cliAdapter } from '../../cli.js'
import { VirtualList } from '../ui/VirtualList.js'
import { SessionRenderer } from './SessionRenderer.js'
import { Session } from './Session.js'
import { useInput } from 'ink'
import { useRouter } from '../router/Router.js'

export function SessionList() {
  const [sessionItems, setSessionItems] = useState<SessionListItem[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const { goBack } = useRouter()

  useEffect(() => {
    const findAllTasks = async () => {
      const result = await cliAdapter.findAllSessionsListItems()

      if (result.success) setSessionItems(result.value)
    }

    findAllTasks()
  }, [])

  useInput((input) => {
    if (input === 'b') {
      if (selectedSessionId) {
        setSelectedSessionId(null)
      } else {
        goBack()
      }
    }
  })

  return (
    <>
      {selectedSessionId === null ? (
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
          additionalHints={[{ keys: 'b', description: 'Назад' }]}
          onSelect={(session) => {
            setSelectedSessionId(session.id)
          }}
        />
      ) : (
        <Session sessionId={selectedSessionId} />
      )}
    </>
  )
}
