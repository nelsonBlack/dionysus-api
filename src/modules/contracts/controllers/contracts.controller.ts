import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Logger,
  UseGuards,
  ParseIntPipe,
  Headers,
} from "@nestjs/common"
import { ContractsService } from "../services/contracts.service"
import { ProfileGuard } from "../../../common/guards/profile.guard"
import { ContractOwnershipGuard } from "../../../common/guards/contract-ownership.guard"
import { Contract } from "../models/contract.model"

interface ApiResponse<T> {
  status: string
  data: T
}

@Controller("contracts")
@UseGuards(ProfileGuard)
export class ContractsController {
  private readonly logger = new Logger(ContractsController.name)

  constructor(private readonly contractsService: ContractsService) {}

  @Get(":id")
  @UseGuards(ContractOwnershipGuard)
  async getContract(
    @Param("id", ParseIntPipe) id: number
  ): Promise<ApiResponse<Contract>> {
    const contract = await this.contractsService.findById(id)
    
    if (!contract) {
      this.logger.error({
        message: "Contract not found",
        contractId: id,
      })
      throw new NotFoundException(`Contract with ID ${id} not found`)
    }

    return { 
      status: "success", 
      data: contract 
    }
  }

  @Get()
  async getContracts(
    @Headers("profile_id") profileId: string
  ): Promise<ApiResponse<Contract[]>> {
    this.logger.debug({
      message: "Get all non-terminated contracts request",
      profileId,
    })

    const contracts = await this.contractsService.findAll(parseInt(profileId))
    return { 
      status: "success", 
      data: contracts 
    }
  }
} 