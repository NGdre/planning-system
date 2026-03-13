import { NavigationProvider } from './components/navigation/NavigationContext.js'
import { ScreenRenderer } from './components/navigation/ScreenRenderer.js'

export default function App() {
  return (
    <NavigationProvider>
      <ScreenRenderer />
    </NavigationProvider>
  )
}
