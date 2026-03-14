import { createContext, useContext, useState, ReactNode } from 'react'
import {
  CompleteScreenResultMap,
  Screen,
  ScreenResultMap,
  ScreenWithResult,
} from './ScreenRenderer.js'

interface NavigationContextType {
  stack: Screen[]
  push: (screen: Screen) => void
  pop: () => void
  goHome: () => void
  popWithResult: <K extends ScreenWithResult>(result: ScreenResultMap[K]) => void
  getResult: <K extends ScreenWithResult>(screenName: K) => ScreenResultMap[K] | null
  clearResult: (screenName: ScreenWithResult) => void
  currentScreen: Screen | null
}

const NavigationContext = createContext<NavigationContextType | null>(null)

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [history, setHistory] = useState<Screen[]>([{ name: 'MainMenu' }])
  const [resultMap, setResultMap] = useState<Partial<CompleteScreenResultMap>>({})

  const currentScreen = history.length > 0 ? history[history.length - 1] : null

  const push = (screen: Screen) => setHistory((prev) => [...prev, screen])
  const pop = () => {
    if (currentScreen?.name !== 'MainMenu') setHistory((prev) => prev.slice(0, -1))
  }
  const goHome = () => setHistory((prev) => [prev[0]])

  const popWithResult: NavigationContextType['popWithResult'] = (result) => {
    if (history.length < 2) return

    const previousScreen = history[history.length - 2]
    setResultMap((prev) => ({ ...prev, [previousScreen.name]: result }))
    pop()
  }

  const getResult: NavigationContextType['getResult'] = (screenName) => {
    return resultMap[screenName] ?? null
  }

  const clearResult: NavigationContextType['clearResult'] = (screenName) => {
    setResultMap((prev) => {
      const copy = { ...prev }

      delete copy[screenName]

      return copy
    })
  }

  return (
    <NavigationContext.Provider
      value={{
        stack: history,
        push,
        pop,
        goHome,
        currentScreen,
        popWithResult,
        getResult,
        clearResult,
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

export const useNavigation = () => {
  const ctx = useContext(NavigationContext)
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider')
  return ctx
}
