import { Injectable, Logger, BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common"
import { InjectModel } from "@nestjs/sequelize"
import { Profile } from "../../profiles/models/profile.model"
import { Job } from "../../jobs/models/job.model"
import { Contract } from "../../contracts/models/contract.model"
import { Sequelize } from "sequelize-typescript"
import { Transaction } from "sequelize"
import { Op } from "sequelize"

@Injectable()
export class BalancesService {
  private readonly logger = new Logger(BalancesService.name)

  constructor(
    @InjectModel(Profile)
    private profileModel: typeof Profile,
    @InjectModel(Job)
    private jobModel: typeof Job,
    private sequelize: Sequelize
  ) {}

  async deposit(userId: number, amount: number, profileId: number): Promise<Profile> {
    this.logger.verbose({
      message: 'Starting deposit',
      userId,
      amount,
      profileId
    });

    if (!amount || amount <= 0) {
      throw new BadRequestException("Amount must be positive");
    }

    // Add retries for transaction conflicts
    const MAX_RETRIES = 3;
    let retryCount = 0;
    
    while (retryCount < MAX_RETRIES) {
      try {
        return await this.sequelize.transaction({
          isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
        }, async (t) => {
          // Get and lock the target profile
          const profile = await this.profileModel.findOne({
            where: { id: userId },
            lock: { level: t.LOCK.UPDATE, of: this.profileModel },
            transaction: t,
          });

          if (!profile) {
            throw new NotFoundException("User not found");
          }

          if (profile.type !== "client") {
            throw new ForbiddenException("Only clients can make deposits");
          }

          // Calculate total unpaid jobs amount
          const unpaidJobs = await this.jobModel.findAll({
            attributes: [
              [this.sequelize.fn('SUM', this.sequelize.col('price')), 'total']
            ],
            where: { 
              paid: false,
            },
            include: [{
              model: Contract,
              where: {
                status: 'in_progress',
                ClientId: userId
              },
              required: true
            }],
            raw: true,
            transaction: t
          }) as unknown as [{ total: number }];

          const totalJobsToPay = unpaidJobs[0]?.total || 0;

          const maxDeposit = totalJobsToPay * 0.25;

          if (amount > maxDeposit) {
            this.logger.warn({
              message: 'Deposit exceeds limit',
              amount,
              maxDeposit,
              totalJobsToPay
            });
            throw new BadRequestException("Deposit amount exceeds 25% of total jobs to pay");
          }

          // Update balance atomically
          const [affectedCount] = await this.profileModel.increment('balance', { 
            by: amount,
            where: {
              id: profile.id,
              balance: profile.balance
            },
            transaction: t 
          }) as unknown as [number];

          // If no rows were updated, it means another transaction modified the balance
          if (affectedCount === 0) {
            throw new Error('Concurrent modification detected');
          }

          // Reload profile to get updated balance
          await profile.reload({ transaction: t });

          this.logger.verbose({
            message: 'Deposit completed successfully',
            userId,
            amount,
            newBalance: profile.balance
          });

          return profile;
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
} 