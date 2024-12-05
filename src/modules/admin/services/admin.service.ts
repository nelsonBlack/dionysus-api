import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common"
import { InjectModel } from "@nestjs/sequelize"
import { Profile } from "../../profiles/models/profile.model"
import { Job } from "../../jobs/models/job.model"
import { Contract } from "../../contracts/models/contract.model"
import { Sequelize } from "sequelize-typescript"
import { QueryTypes } from "sequelize"
import { Op } from "sequelize"

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name)

  constructor(
    @InjectModel(Profile)
    private profileModel: typeof Profile,
    @InjectModel(Job)
    private jobModel: typeof Job,
    private sequelize: Sequelize
  ) {}

  /**
   * Gets the profession with highest earnings in a date range
   *
   * @todo Improvements needed:
   * 1. Handle tied earnings:
   *    - Could add secondary sorting by earliest payment date
   *    - Or include all professions that tied for highest earnings
   *    - Current behavior returns first profession found
   * 2. Add pagination for large result sets
   * 3. Add caching for frequently queried date ranges
   * 4. Add metrics/logging for performance monitoring
   */
  async getBestProfession(start: Date, end: Date) {
    const results = (await this.sequelize.query(
      `
      WITH JobEarnings AS (
        SELECT 
          p.profession,
          CAST(SUM(j.price) AS FLOAT) as earned,
          MAX(j.paymentDate) as latest_payment
        FROM Profiles p
        INNER JOIN Contracts c ON c.ContractorId = p.id
        INNER JOIN Jobs j ON j.ContractId = c.id
        WHERE 
          j.paid = 1
          AND date(j.paymentDate) >= date(:start)
          AND date(j.paymentDate) <= date(:end)
        GROUP BY p.profession
      )
      SELECT profession, earned
      FROM JobEarnings
      ORDER BY earned DESC, latest_payment ASC
      LIMIT 1
    `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          start: start.toISOString().split("T")[0],
          end: end.toISOString().split("T")[0],
        },
      }
    )) as Array<{ profession: string; earned: number }>

    if (!results.length) {
      throw new NotFoundException({
        statusCode: 404,
        message: "No paid jobs found in the specified date range",
        error: "Not Found",
      })
    }

    return {
      profession: results[0].profession,
      earned: results[0].earned,
    }
  }

  async getBestClients(start: Date, end: Date, limit: number = 2) {
    const results = (await this.sequelize.query(
      `
      WITH ClientPayments AS (
        SELECT 
          p.id,
          p.firstName,
          p.lastName,
          CAST(SUM(j.price) AS FLOAT) as paid
        FROM Profiles p
        INNER JOIN Contracts c ON c.ClientId = p.id
        INNER JOIN Jobs j ON j.ContractId = c.id
        WHERE 
          j.paid = 1
          AND date(j.paymentDate) >= date(:start)
          AND date(j.paymentDate) <= date(:end)
        GROUP BY p.id
        ORDER BY paid DESC
        LIMIT :limit
      )
      SELECT 
        id,
        firstName || ' ' || lastName as fullName,
        paid
      FROM ClientPayments
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          start: start.toISOString().split("T")[0],
          end: end.toISOString().split("T")[0],
          limit,
        },
      }
    )) as Array<{ id: number; fullName: string; paid: number }>

    if (!results.length) {
      throw new NotFoundException({
        statusCode: 404,
        message: "No paid jobs found in the specified date range",
        error: "Not Found",
      })
    }

    return results
  }
}
