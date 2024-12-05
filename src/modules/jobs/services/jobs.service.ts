import { Injectable, Logger } from "@nestjs/common"
import { InjectModel } from "@nestjs/sequelize"
import { Job } from "../models/job.model"
import { Contract } from "../../contracts/models/contract.model"
import { Op } from "sequelize"

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name)

  constructor(
    @InjectModel(Job)
    private jobModel: typeof Job
  ) {}

  async findUnpaid(profileId: number): Promise<Job[]> {
    this.logger.debug({
      message: "Finding unpaid jobs",
      profileId,
    })

    return this.jobModel.findAll({
      where: {
        paid: false,
      },
      include: [
        {
          model: Contract,
          where: {
            status: "in_progress",
            [Op.or]: [
              { ClientId: profileId },
              { ContractorId: profileId }
            ],
          },
        },
      ],
    })
  }
} 