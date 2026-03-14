import { ErrorsProvider } from './components/error-handling/ErrorsContext.js'
import { ErrorDisplay } from './components/error-handling/ErrorDisplay.js'
import { NavigationProvider } from './components/navigation/NavigationContext.js'
import NavigationKeysHandler from './components/navigation/NavigationKeysHandler.js'
import { ScreenRenderer } from './components/navigation/ScreenRenderer.js'

export default function App() {
  return (
    <ErrorsProvider>
      <NavigationProvider>
        <ScreenRenderer />
        <NavigationKeysHandler />
        <ErrorDisplay />
      </NavigationProvider>
    </ErrorsProvider>
  )
}
