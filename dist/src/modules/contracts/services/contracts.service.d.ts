import { Contract } from "../models/contract.model";
export declare class ContractsService {
    private contractModel;
    private readonly logger;
    constructor(contractModel: typeof Contract);
    findOne(id: number): Promise<Contract>;
    findAll(profileId: number): Promise<Contract[]>;
    findById(id: number): Promise<Contract | null>;
}
