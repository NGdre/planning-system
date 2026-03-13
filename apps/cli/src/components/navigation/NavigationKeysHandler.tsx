import { Box, Text, useInput } from 'ink'
import { useNavigation } from './NavigationContext.js'
import { ScreenName } from './ScreenRenderer.js'
import { useEffect, useState } from 'react'

const ENABLE_NAVIGATION_KEYS: ScreenName[] = ['SessionList', 'TaskList']

export default function NavigationKeysHandler() {
  const { pop, goHome, currentScreen } = useNavigation()

  const [keyInput, setKeyInput] = useState<string | null>(null)

  useInput((input, key) => {
    if (currentScreen && !ENABLE_NAVIGATION_KEYS.includes(currentScreen.name)) return

    if (input === 'b' || key.escape) {
      pop()
    }

    if (input === 'm') {
      goHome()
    }

    setKeyInput(input)
  })

  useEffect(() => {
    setKeyInput(null)
  }, [currentScreen])

  const showHint = keyInput && currentScreen && ENABLE_NAVIGATION_KEYS.includes(currentScreen.name)

  return (
    showHint && (
      <Box marginTop={1}>
        <Text>Вы нажали: "{keyInput}"</Text>
      </Box>
    )
  )
}
