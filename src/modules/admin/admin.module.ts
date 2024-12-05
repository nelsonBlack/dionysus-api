import { Module } from "@nestjs/common"
import { SequelizeModule } from "@nestjs/sequelize"
import { Profile } from "../profiles/models/profile.model"
import { Job } from "../jobs/models/job.model"
import { Contract } from "../contracts/models/contract.model"
import { AdminController } from "./controllers/admin.controller"
import { AdminService } from "./services/admin.service"

@Module({
  imports: [SequelizeModule.forFeature([Job, Contract, Profile])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
