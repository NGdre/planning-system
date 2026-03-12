import { NavigationProvider } from './components/navigation/NavigationContext.js'
import { ScreenRenderer } from './components/navigation/ScreenRenderer.js'
import { TaskStore } from './components/task/TaskStore.js'

export default function App() {
  return (
    <TaskStore>
      <NavigationProvider>
        <ScreenRenderer />
      </NavigationProvider>
    </TaskStore>
  )
}
