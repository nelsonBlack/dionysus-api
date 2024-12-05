import { ContractsService } from "../services/contracts.service";
import { Contract } from "../models/contract.model";
interface ApiResponse<T> {
    status: string;
    data: T;
}
export declare class ContractsController {
    private readonly contractsService;
    private readonly logger;
    constructor(contractsService: ContractsService);
    getContract(id: number): Promise<ApiResponse<Contract>>;
    getContracts(): Promise<Contract[]>;
}
export {};
