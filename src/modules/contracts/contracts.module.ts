import { Module } from "@nestjs/common"
import { SequelizeModule } from "@nestjs/sequelize"
import { ContractsService } from "./services/contracts.service"
import { Profile } from "../profiles/models/profile.model"
import { Contract } from "./models/contract.model"
import { ContractsController } from "./controllers/contracts.controller"

@Module({
  imports: [SequelizeModule.forFeature([Contract, Profile])],
  controllers: [ContractsController],
  providers: [ContractsService],
})
export class ContractsModule {} 