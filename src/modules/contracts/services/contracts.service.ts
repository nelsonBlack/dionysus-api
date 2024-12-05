import { Injectable, NotFoundException, Logger } from "@nestjs/common"
import { InjectModel } from "@nestjs/sequelize"
import { Op } from "sequelize"
import { Contract } from "../models/contract.model"

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name)

  constructor(
    @InjectModel(Contract)
    private contractModel: typeof Contract
  ) {}

  async findOne(id: number): Promise<Contract> {
    this.logger.debug({
      message: "Finding contract",
      contractId: id,
    })

    const contract = await this.contractModel.findByPk(id)

    if (!contract) {
      this.logger.error({
        message: "Contract not found",
        contractId: id,
      })
      throw new NotFoundException(`Contract with ID ${id} not found`)
    }

    return contract
  }

  async findAll(profileId: number): Promise<Contract[]> {
    this.logger.debug({
      message: "Finding non-terminated contracts",
      profileId,
    })

    return this.contractModel.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { ClientId: profileId },
              { ContractorId: profileId }
            ]
          },
          {
            status: {
              [Op.ne]: "terminated"
            }
          }
        ]
      }
    })
  }

  async findById(id: number): Promise<Contract | null> {
    return this.contractModel.findByPk(id)
  }
}
