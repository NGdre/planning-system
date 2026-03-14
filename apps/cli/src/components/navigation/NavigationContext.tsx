import { createContext, useContext, useState, ReactNode } from 'react'
import {
  CompleteScreenResultMap,
  Screen,
  ScreenResultMap,
  ScreenWithResult,
} from './ScreenRenderer.js'

/**
 * Interface describing the navigation context value.
 * Provides methods to manipulate the navigation stack and pass results back.
 */
interface NavigationContextType {
  /** The current navigation stack (history) as an array of screens. */
  stack: Screen[]
  /** Pushes a new screen onto the stack. */
  push: (screen: Screen) => void
  /** Pops the top screen from the stack, unless it is the main menu. */
  pop: () => void
  /** Resets the stack to only the main menu screen. */
  goHome: () => void
  /**
   * Pops the current screen and passes a result back to the previous screen.
   * The result is stored temporarily and will be available to the previous screen
   * via getResult after it becomes active again.
   * @param result - The result to pass back, typed according to the previous screen.
   */
  popWithResult: <K extends ScreenWithResult>(result: ScreenResultMap[K]) => void
  /**
   * Retrieves a stored result for a specific screen, if any.
   * The result is cleared after screen change
   * @param screenName - The name of the screen expecting the result.
   * @returns The result, or null if none is available.
   */
  getResult: <K extends ScreenWithResult>(screenName: K) => ScreenResultMap[K] | null
  /**
   * Explicitly clears any stored result for a given screen.
   * @param screenName - The screen whose result should be cleared.
   */
  clearResult: (screenName: ScreenWithResult) => void
  /** The currently active screen (top of the stack), or null if the stack is empty. */
  currentScreen: Screen | null
}

const NavigationContext = createContext<NavigationContextType | null>(null)

/**
 * Provides navigation state and methods to its children.
 * Should be placed near the root of the component tree.
 */
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

/**
 * Hook to access the navigation context.
 * Must be used within a NavigationProvider.
 * @returns The navigation context value.
 * @throws If used outside of NavigationProvider.
 */
export const useNavigation = () => {
  const ctx = useContext(NavigationContext)
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider')
  return ctx
}
