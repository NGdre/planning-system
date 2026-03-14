import { useEffect } from 'react'
import { useNavigation } from './NavigationContext.js'
import { ScreenResultMap, ScreenWithResult } from './ScreenRenderer.js'

export function usePopResult<T extends ScreenWithResult>(screenName: T): ScreenResultMap[T] | null {
  const { getResult, clearResult } = useNavigation()

  useEffect(() => {
    return () => {
      clearResult(screenName)
    }
  }, [screenName, clearResult])

  const result = getResult(screenName)

  return result
}
