import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
  HasMany,
} from "sequelize-typescript"
import { Profile } from "../../profiles/models/profile.model"
import { Job } from "../../jobs/models/job.model"

@Table
export class Contract extends Model {
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  terms: string

  @Column({
    type: DataType.ENUM("new", "in_progress", "terminated"),
  })
  status: "new" | "in_progress" | "terminated"

  @ForeignKey(() => Profile)
  @Column
  ContractorId: number

  @ForeignKey(() => Profile)
  @Column
  ClientId: number

  @BelongsTo(() => Profile, "ContractorId")
  contractor: Profile

  @BelongsTo(() => Profile, "ClientId")
  client: Profile

  @HasMany(() => Job)
  jobs: Job[]
}
