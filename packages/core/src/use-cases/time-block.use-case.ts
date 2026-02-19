import { PlannerService } from '../services/planner.service.js'

export class ScheduleTimeBlockForTask {
  constructor(private readonly plannerService: PlannerService) {}

  async execute(taskId: string, startTime: Date, endTime: Date) {
    return await this.plannerService.schedule(taskId, startTime, endTime)
  }
}
