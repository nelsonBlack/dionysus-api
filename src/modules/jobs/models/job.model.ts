import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
} from "sequelize-typescript"
import { Contract } from "../../contracts/models/contract.model"

@Table
export class Job extends Model {
  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  description: string

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: false,
  })
  price: number

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  paid: boolean

  @Column(DataType.DATE)
  paymentDate: Date

  @ForeignKey(() => Contract)
  @Column
  ContractId: number

  @BelongsTo(() => Contract)
  contract: Contract
}
