import { Module } from "@nestjs/common"
import { SequelizeModule } from "@nestjs/sequelize"
import { ContractsController } from "./controllers/contracts.controller"
import { ContractsService } from "./services/contracts.service"
import { Contract } from "./models/contract.model"
import { Profile } from "./models/profile.model"

@Module({
  imports: [SequelizeModule.forFeature([Contract, Profile])],
  controllers: [ContractsController],
  providers: [ContractsService],
})
export class ContractsModule {}
