import { Module } from "@nestjs/common"
import { SequelizeModule } from "@nestjs/sequelize"
import { Job } from "./models/job.model"

@Module({
  imports: [SequelizeModule.forFeature([Job])],
  exports: [SequelizeModule],
})
export class JobsModule {}
