import { Text } from 'ink'
import { MainMenu } from '../menu/MainMenu.js'
import NewTaskMenu from '../menu/NewTaskMenu.js'
import TaskMenu from '../menu/TaskMenu.js'
import { Session } from '../session/Session.js'
import { SessionList } from '../session/SessionList.js'
import { ScheduleTask } from '../task/ScheduleTask.js'
import { TaskList } from '../task/TaskList.js'
import { useNavigation } from './NavigationContext.js'

/**
 * Union of all screen names available in the application.
 */
export type ScreenName =
  | 'Session'
  | 'SessionList'
  | 'TaskMenu'
  | 'NewTaskMenu'
  | 'TaskList'
  | 'ScheduleTask'
  | 'MainMenu'

/**
 * Maps each screen name to the type of parameters it accepts when navigated to.
 * Screens not listed here receive no parameters (their params type is undefined).
 */
export type ScreenParamsMap = {
  Session: { sessionId?: string; allowBack?: boolean }
  TaskMenu: { taskId: string; allowBack?: boolean }
  ScheduleTask: { taskId: string }
}

/**
 * Maps each screen name to the type of result it can receive when returning from a next screen.
 * Only screens that can handle a result are listed here.
 */
export type ScreenResultMap = {
  SessionList: { sessionId: string }
  TaskList: { taskId: string }
}

/**
 * Union of screen names that are capable of receiving a result when returning from a next screen.
 * Derived from the keys of ScreenResultMap.
 */
export type ScreenWithResult = keyof ScreenResultMap

/**
 * A complete mapping that assigns a result type (or undefined) to every screen.
 * Used internally to maintain a type-safe result store.
 */
export type CompleteScreenResultMap = {
  [K in ScreenName]: K extends ScreenWithResult ? ScreenResultMap[K] : undefined
}

/**
 * A discriminated union representing a screen entry in the navigation stack.
 * - If the screen accepts parameters, the type includes them.
 * - Otherwise, it contains only the screen name.
 */
export type Screen = {
  [K in ScreenName]: K extends keyof ScreenParamsMap
    ? {
        name: K
        params: ScreenParamsMap[K]
      }
    : { name: K }
}[ScreenName]

/**
 * Renders the current screen based on the navigation state.
 */
export const ScreenRenderer = () => {
  const { currentScreen } = useNavigation()
  if (!currentScreen) return null

  switch (currentScreen.name) {
    case 'MainMenu':
      return <MainMenu />

    case 'SessionList':
      return <SessionList />

    case 'TaskMenu':
      return <TaskMenu params={currentScreen.params} />

    case 'NewTaskMenu':
      return <NewTaskMenu />

    case 'TaskList':
      return <TaskList />

    case 'ScheduleTask':
      return <ScheduleTask params={currentScreen.params} />

    case 'Session':
      return <Session params={currentScreen.params} />

    default:
      return <Text>Ошибка: неизвестный экран "{(currentScreen as { name: string }).name}"</Text>
  }
}
