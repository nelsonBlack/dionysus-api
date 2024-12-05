import { IsISO8601, IsNotEmpty } from "class-validator"
import { Transform } from "class-transformer"

export class GetBestProfessionDto {
  @IsNotEmpty({ message: "Start date is required" })
  @IsISO8601({}, { message: "start must be a valid ISO 8601 date string" })
  @Transform(({ value }) => value || null)
  start: Date

  @IsNotEmpty({ message: "End date is required" })
  @IsISO8601({}, { message: "end must be a valid ISO 8601 date string" })
  @Transform(({ value }) => value || null)
  end: Date
}
