import { Module } from "@nestjs/common"
import { SequelizeModule } from "@nestjs/sequelize"
import { Profile } from "../profiles/models/profile.model"
import { Job } from "../jobs/models/job.model"
import { Contract } from "../contracts/models/contract.model"
import { BalancesController } from "./controllers/balances.controller"
import { BalancesService } from "./services/balances.service"

@Module({
  imports: [
    SequelizeModule.forFeature([Profile, Job, Contract]),
  ],
  controllers: [BalancesController],
  providers: [BalancesService],
})
export class BalancesModule {} 