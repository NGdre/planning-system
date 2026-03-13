import { createContext, useContext, useState, ReactNode } from 'react'
import { Screen } from './ScreenRenderer.js'

interface NavigationContextType {
  stack: Screen[]
  push: (screen: Screen) => void
  pop: () => void
  goHome: () => void
  currentScreen: Screen | null
}

const NavigationContext = createContext<NavigationContextType | null>(null)

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [history, setHistory] = useState<Screen[]>([{ name: 'MainMenu' }])

  const currentScreen = history.length > 0 ? history[history.length - 1] : null

  const push = (screen: Screen) => setHistory((prev) => [...prev, screen])
  const pop = () => {
    if (currentScreen?.name !== 'MainMenu') setHistory((prev) => prev.slice(0, -1))
  }
  const goHome = () => setHistory((prev) => [prev[0]])

  return (
    <NavigationContext.Provider value={{ stack: history, push, pop, goHome, currentScreen }}>
      {children}
    </NavigationContext.Provider>
  )
}

export const useNavigation = () => {
  const ctx = useContext(NavigationContext)
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider')
  return ctx
}
