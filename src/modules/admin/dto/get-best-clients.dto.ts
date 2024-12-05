import { ApiProperty } from "@nestjs/swagger"
import { IsISO8601, IsNotEmpty, IsOptional, IsInt, Min } from "class-validator"
import { Transform, Type } from "class-transformer"

export class GetBestClientsDto {
  @ApiProperty({
    description: "Start date for the query period",
    example: "2024-01-01T00:00:00Z",
  })
  @IsNotEmpty({ message: "Start date is required" })
  @IsISO8601({}, { message: "start must be a valid ISO 8601 date string" })
  @Transform(({ value }) => value || null)
  start: Date

  @ApiProperty({
    description: "End date for the query period",
    example: "2024-12-31T23:59:59Z",
  })
  @IsNotEmpty({ message: "End date is required" })
  @IsISO8601({}, { message: "end must be a valid ISO 8601 date string" })
  @Transform(({ value }) => value || null)
  end: Date

  @ApiProperty({
    description: "Number of clients to return",
    example: 2,
    required: false,
    default: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 2
}
