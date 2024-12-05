import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Logger,
  UseGuards,
  ParseIntPipe,
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
export class ContractsController {
  private readonly logger = new Logger(ContractsController.name)

  constructor(private readonly contractsService: ContractsService) {}

  @Get(":id")
  @UseGuards(ProfileGuard, ContractOwnershipGuard)
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
  async getContracts() {
    this.logger.debug({
      message: "Get all contracts request",
    })

    // Note: You'll need to implement proper profile ID handling
    const profileId = 1 // This should come from your auth system
    return this.contractsService.findAll(profileId)
  }
} 