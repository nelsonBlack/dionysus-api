import { IsISO8601, IsNotEmpty, IsOptional, IsInt, Min } from "class-validator"
import { Transform } from "class-transformer"
import { Type } from "class-transformer"

export class GetBestClientsDto {
  @IsNotEmpty({ message: "Start date is required" })
  @IsISO8601({}, { message: "start must be a valid ISO 8601 date string" })
  @Transform(({ value }) => value || null)
  start: Date

  @IsNotEmpty({ message: "End date is required" })
  @IsISO8601({}, { message: "end must be a valid ISO 8601 date string" })
  @Transform(({ value }) => value || null)
  end: Date

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 2
}
