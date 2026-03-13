import { Text } from 'ink'
import { MainMenu } from '../menu/MainMenu.js'
import NewTaskMenu from '../menu/NewTaskMenu.js'
import TaskMenu from '../menu/TaskMenu.js'
import { Session } from '../session/Session.js'
import { SessionList } from '../session/SessionList.js'
import { ScheduleTask } from '../task/ScheduleTask.js'
import { TaskList } from '../task/TaskList.js'
import { useNavigation } from './NavigationContext.js'

export type ScreenName =
  | 'Session'
  | 'SessionList'
  | 'TaskMenu'
  | 'NewTaskMenu'
  | 'TaskList'
  | 'ScheduleTask'
  | 'MainMenu'

export type ScreenParamsMap = {
  Session: { sessionId?: string }
  TaskMenu: { taskId: string }
  ScheduleTask: { taskId: string }
}

export type Screen = {
  [K in ScreenName]: K extends keyof ScreenParamsMap
    ? {
        name: K
        params: ScreenParamsMap[K]
      }
    : { name: K }
}[ScreenName]

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
