import { Injectable, Logger, BadRequestException, ForbiddenException, NotFoundException, InternalServerErrorException } from "@nestjs/common"
import { InjectModel } from "@nestjs/sequelize"
import { Job } from "../models/job.model"
import { Profile } from "../../profiles/models/profile.model"
import { Contract } from "../../contracts/models/contract.model"
import { Sequelize } from "sequelize-typescript"
import { Transaction } from "sequelize"
import { Op } from "sequelize"

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name)

  constructor(
    @InjectModel(Job)
    private jobModel: typeof Job,
    @InjectModel(Profile)
    private profileModel: typeof Profile,
    private sequelize: Sequelize
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
              { ContractorId: profileId },
            ],
          },
        },
      ],
    })
  }

  async payJob(jobId: number, profileId: number): Promise<Job> {
    const transaction = await this.sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
    })

    try {
      // First find job without paid check to handle not found case
      const job = await this.jobModel.findOne({
        where: { id: jobId },
        include: [Contract],
        lock: Transaction.LOCK.UPDATE,
        transaction,
      })

      if (!job) {
        throw new NotFoundException("Job not found")
      }

      if (job.paid) {
        throw new BadRequestException("Job is already paid")
      }

      // Get client profile
      const client = await this.profileModel.findOne({
        where: { id: profileId },
        lock: Transaction.LOCK.UPDATE,
        transaction,
      })

      if (!client) {
        throw new NotFoundException("Client not found")
      }

      if (client.type !== "client") {
        throw new ForbiddenException("Only clients can pay for jobs")
      }

      if (client.id !== job.contract.ClientId) {
        throw new ForbiddenException("Job does not belong to your contracts")
      }

      if (client.balance < job.price) {
        throw new BadRequestException("Insufficient balance")
      }

      // Get contractor profile
      const contractor = await this.profileModel.findOne({
        where: { id: job.contract.ContractorId },
        lock: Transaction.LOCK.UPDATE,
        transaction,
      })

      if (!contractor) {
        throw new NotFoundException("Contractor not found")
      }

      // Update job with optimistic locking
      const [updatedCount] = await this.jobModel.update(
        {
          paid: true,
          paymentDate: new Date(),
        },
        {
          where: { 
            id: jobId,
            paid: false
          },
          transaction,
        }
      )

      if (updatedCount === 0) {
        throw new BadRequestException("Job has already been paid")
      }

      // Update balances
      await this.updateBalances(client, contractor, job.price, transaction)

      await transaction.commit()
      return await this.jobModel.findByPk(jobId, { include: [Contract] })

    } catch (error) {
      await transaction?.rollback()
      throw error
    }
  }

  private async updateBalances(
    client: Profile,
    contractor: Profile,
    amount: number,
    transaction: Transaction
  ): Promise<void> {
    await this.profileModel.update(
      { balance: client.balance - amount },
      {
        where: { id: client.id },
        transaction,
      }
    )

    await this.profileModel.update(
      { balance: contractor.balance + amount },
      {
        where: { id: contractor.id },
        transaction,
      }
    )
  }

  private async markJobAsPaid(job: Job, transaction: Transaction): Promise<void> {
    await this.jobModel.update(
      {
        paid: true,
        paymentDate: new Date(),
      },
      {
        where: { id: job.id },
        transaction,
      }
    )

    // Update the job instance to reflect changes
    job.paid = true
    job.paymentDate = new Date()
  }
} 