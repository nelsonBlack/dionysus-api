import { Module } from "@nestjs/common"
import { SequelizeModule } from "@nestjs/sequelize"
import { Profile } from "./models/profile.model"

@Module({
  imports: [SequelizeModule.forFeature([Profile])],
  exports: [SequelizeModule],
})
export class ProfilesModule {}
