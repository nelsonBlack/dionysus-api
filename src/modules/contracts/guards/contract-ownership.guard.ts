import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
} from "@nestjs/common"
import { Logger } from "@nestjs/common"
import { ContractsService } from "../services/contracts.service"

/**
 * Guard that handles contract ownership verification
 *
 * This approach:
 * 1. Separates authorization logic - Keeps ownership checks isolated from business logic
 * 2. Maintains security by not revealing ownership - Returns 404 instead of 403 to prevent information leakage
 * 3. Provides proper logging - Logs unauthorized access attempts for monitoring
 * 4. Can be reused across different endpoints - Single source of truth for contract access control
 */
@Injectable()
export class ContractOwnershipGuard implements CanActivate {
  private readonly logger = new Logger(ContractOwnershipGuard.name)

  constructor(private readonly contractsService: ContractsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const contractId = parseInt(request.params.id)
    const profileId = parseInt(request.headers["profile_id"])

    // Get contract details without exposing them in the response
    const contract = await this.contractsService.findById(contractId)

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${contractId} not found`)
    }

    // Check if the requesting profile owns the contract
    const canView =
      contract.ClientId === profileId || contract.ContractorId === profileId

    if (!canView) {
      // Log unauthorized access attempts for security monitoring
      this.logger.error({
        message: "Unauthorized access to contract",
        contractId,
        profileId,
      })
      // Return 404 instead of 403 to prevent information disclosure
      throw new NotFoundException(`Contract with ID ${contractId} not found`)
    }

    return true
  }
}
