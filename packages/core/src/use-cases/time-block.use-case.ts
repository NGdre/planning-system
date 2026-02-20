import { TaskEntity } from '../entities/task.entity.js'
import { TaskRepository, TimeBlockRepository } from '../ports/repository.port.js'
import { PlannerService } from '../services/planner.service.js'
import { VoidResult } from '../types.js'

export class ScheduleTimeBlockForTask {
  constructor(
    private readonly plannerService: PlannerService,
    private readonly taskRepo: TaskRepository,
    private readonly timeBlockRepo: TimeBlockRepository
  ) {}

  async execute(taskId: string, startTime: Date, endTime: Date): Promise<VoidResult> {
    const task = await this.taskRepo.findById(taskId)

    if (!task)
      return {
        success: false,
        error: `the task with id ${taskId} is not found`,
      }

    const te = TaskEntity.restore(task)

    if (!te.canSchedule())
      return {
        success: false,
        error: `the task with id ${taskId} can not be scheduled`,
      }

    if (te.status === 'draft') return await this.plannerService.schedule(taskId, startTime, endTime)

    if (te.status === 'scheduled') {
      const timeBlock = await this.timeBlockRepo.findByTaskId(taskId)

      if (!timeBlock) throw new Error(`can not find time block for task with id ${taskId}`)

      return await this.plannerService.rescheduleTimeBlock(timeBlock.id, startTime, endTime)
    }

    throw new Error('unhandled task status in scheduling')
  }
}
