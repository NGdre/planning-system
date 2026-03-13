import { useInput } from 'ink'
import { useNavigation } from './NavigationContext.js'
import { ScreenName } from './ScreenRenderer.js'

const ENABLE_NAVIGATION_KEYS: ScreenName[] = ['SessionList', 'TaskList']

export default function NavigationKeysHandler() {
  const { pop, goHome, currentScreen } = useNavigation()

  useInput((input, key) => {
    if (currentScreen && !ENABLE_NAVIGATION_KEYS.includes(currentScreen.name)) return

    if (input === 'b' || key.escape) {
      pop()
    }
    if (input === 'm') {
      goHome()
    }
  })
  return null
}
