import { SessionDTO, SessionEntity } from '../entities/session.entity.js'
import { TaskDTO, TaskEntity } from '../entities/task.entity.js'

export enum TaskAction {
  START = 'START',
  SCHEDULE = 'SCHEDULE',
  EDIT = 'EDIT',
  CANCEL = 'CANCEL',
  COMPLETE = 'COMPLETE',
  DELETE = 'DELETE',
}

export enum SessionAction {
  PAUSE = 'PAUSE',
  RESUME = 'RESUME',
  STOP = 'STOP',
}

export class UserActionsService {
  getTaskActions(task: TaskDTO) {
    const taskEntity = TaskEntity.restore(task)
    const actions: TaskAction[] = []

    if (taskEntity.canStart()) actions.push(TaskAction.START)
    if (taskEntity.canSchedule()) actions.push(TaskAction.SCHEDULE)
    if (taskEntity.canEdit()) actions.push(TaskAction.EDIT)
    if (taskEntity.canCancel()) actions.push(TaskAction.CANCEL)
    if (taskEntity.canComplete()) actions.push(TaskAction.COMPLETE)
    if (taskEntity.canDelete()) actions.push(TaskAction.DELETE)

    return actions
  }

  getSessionActions(session: SessionDTO) {
    const sessionEntity = SessionEntity.restore(session)
    const actions: SessionAction[] = []

    if (sessionEntity.canResume()) actions.push(SessionAction.RESUME)
    if (sessionEntity.canPause()) actions.push(SessionAction.PAUSE)
    if (sessionEntity.canStop()) actions.push(SessionAction.STOP)

    return actions
  }
}
