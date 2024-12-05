import { Module } from "@nestjs/common"
import { SequelizeModule } from "@nestjs/sequelize"
import { Job } from "./models/job.model"
import { Contract } from "../contracts/models/contract.model"
import { JobsController } from "./controllers/jobs.controller"
import { JobsService } from "./services/jobs.service"

@Module({
  imports: [SequelizeModule.forFeature([Job, Contract])],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
