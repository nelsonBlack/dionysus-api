import { Model } from "sequelize-typescript";
import { Contract } from "../../contracts/models/contract.model";
export declare class Job extends Model {
    description: string;
    price: number;
    paid: boolean;
    paymentDate: Date;
    ContractId: number;
    contract: Contract;
}
