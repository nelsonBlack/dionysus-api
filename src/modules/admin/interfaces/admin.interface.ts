import { ApiProperty } from "@nestjs/swagger"

export class BestProfessionResponse {
  @ApiProperty({ example: "Developer" })
  profession: string

  @ApiProperty({ example: 2500.5 })
  earned: number
}

export class BestClientResponse {
  @ApiProperty({ example: 1 })
  id: number

  @ApiProperty({ example: "John Doe" })
  fullName: string

  @ApiProperty({ example: 2500.5 })
  paid: number
}
