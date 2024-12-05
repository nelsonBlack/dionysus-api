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
    this.logger.verbose({
      message: 'Starting job payment',
      jobId,
      profileId
    });
  
    // Add retries for transaction conflicts
    const MAX_RETRIES = 3;
    let retryCount = 0;
    
    while (retryCount < MAX_RETRIES) {
      try {
        return await this.sequelize.transaction({
          isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
        }, async (t) => {
          // Find and lock the job with FOR UPDATE lock
          const job = await this.jobModel.findOne({
            where: { id: jobId },
            include: [Contract],
            lock: { level: t.LOCK.UPDATE, of: this.jobModel },
            transaction: t,
          });
  
          if (!job) {
            throw new NotFoundException("Job not found");
          }
  
          // Check if job was paid while we were waiting for lock
          if (job.paid) {
            throw new BadRequestException("Job is already paid");
          }
  
          // Get and lock client profile
          const client = await this.profileModel.findOne({
            where: { id: profileId },
            lock: true,
            transaction: t,
          });
  
          if (!client) {
            throw new NotFoundException("Client not found");
          }
  
          if (client.type !== "client") {
            throw new ForbiddenException("Only clients can pay for jobs");
          }
  
          if (client.id !== job.contract.ClientId) {
            throw new ForbiddenException("Job does not belong to your contracts");
          }
  
          if (client.balance < job.price) {
            throw new BadRequestException("Insufficient balance");
          }
  
          const contractor = await this.profileModel.findOne({
            where: { id: job.contract.ContractorId },
            lock: true,
            transaction: t,
          });
  
          await job.update(
            { paid: true, paymentDate: new Date() },
            { transaction: t }
          );
  
          await Promise.all([
            client.decrement('balance', { by: job.price, transaction: t }),
            contractor.increment('balance', { by: job.price, transaction: t })
          ]);
  
          const updatedJob = await this.jobModel.findByPk(jobId, {
            include: [Contract],
            transaction: t
          });
  
          return updatedJob;
        });
      } catch (error) {
        retryCount++;
        
        // If it's the last retry or not a transaction error, rethrow
        if (retryCount === MAX_RETRIES || 
            !error.message.includes('SQLITE_ERROR: cannot start a transaction')) {
          throw error;
        }
        
        // Wait a small random amount of time before retrying
        await new Promise(resolve => 
          setTimeout(resolve, Math.random() * 100)
        );
      }
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