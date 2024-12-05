import { CanActivate, ExecutionContext } from "@nestjs/common";
import { ContractsService } from "../services/contracts.service";
export declare class ContractOwnershipGuard implements CanActivate {
    private readonly contractsService;
    private readonly logger;
    constructor(contractsService: ContractsService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
