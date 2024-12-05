import { Module } from "@nestjs/common"
import { SequelizeModule } from "@nestjs/sequelize"
import { ContractsModule } from "./modules/contracts/contracts.module"
import { ProfilesModule } from "./modules/profiles/profiles.module"
import { JobsModule } from "./modules/jobs/jobs.module"
import { AdminModule } from "./modules/admin/admin.module"
import { BalancesModule } from "./modules/balances/balances.module"

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: "sqlite",
      storage: "./database.sqlite3",
      autoLoadModels: true,
      synchronize: true,
    }),
    ContractsModule,
    ProfilesModule,
    JobsModule,
    AdminModule,
    BalancesModule,
  ],
})
export class AppModule {}
