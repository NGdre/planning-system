import { NavigationProvider } from './components/navigation/NavigationContext.js'
import NavigationKeysHandler from './components/navigation/NavigationKeysHandler.js'
import { ScreenRenderer } from './components/navigation/ScreenRenderer.js'

export default function App() {
  return (
    <NavigationProvider>
      <ScreenRenderer />
      <NavigationKeysHandler />
    </NavigationProvider>
  )
}
