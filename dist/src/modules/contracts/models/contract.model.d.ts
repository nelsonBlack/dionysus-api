import { Model } from "sequelize-typescript";
import { Job } from "../../jobs/models/job.model";
import { Profile } from "./profile.model";
export declare class Contract extends Model {
    terms: string;
    status: "new" | "in_progress" | "terminated";
    ContractorId: number;
    ClientId: number;
    contractor: Profile;
    client: Profile;
    jobs: Job[];
}
