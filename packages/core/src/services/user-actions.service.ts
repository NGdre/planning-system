import { TaskDTO, TaskEntity } from '../entities/task.entity.js'

export const enum TaskAction {
  START = 'START',
  SCHEDULE = 'SCHEDULE',
  EDIT = 'EDIT',
  CANCEL = 'CANCEL',
  COMPLETE = 'COMPLETE',
  DELETE = 'DELETE',
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
}
