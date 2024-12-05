import {
  Controller,
  Get,
  Headers,
  UseGuards,
  Logger,
} from "@nestjs/common"
import { JobsService } from "../services/jobs.service"
import { ProfileGuard } from "../../../common/guards/profile.guard"
import { Job } from "../models/job.model"

interface ApiResponse<T> {
  status: string
  data: T
}

@Controller("jobs")
@UseGuards(ProfileGuard)
export class JobsController {
  private readonly logger = new Logger(JobsController.name)

  constructor(private readonly jobsService: JobsService) {}

  @Get("unpaid")
  async getUnpaidJobs(
    @Headers("profile_id") profileId: string
  ): Promise<ApiResponse<Job[]>> {
    this.logger.debug({
      message: "Getting unpaid jobs from active contracts",
      profileId,
    })

    const jobs = await this.jobsService.findUnpaid(parseInt(profileId))
    return {
      status: "success",
      data: jobs,
    }
  }
} 