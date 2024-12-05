import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from "@nestjs/common"
import { ProfileGuard } from "../../../common/guards/profile.guard"
import { BalancesService } from "../services/balances.service"
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
  ApiProperty,
} from "@nestjs/swagger"
import { IsNumber, IsPositive } from "class-validator"

class DepositDto {
  @IsNumber()
  @IsPositive()
  @ApiProperty({
    description: "Amount to deposit",
    example: 100,
    type: Number,
  })
  amount: number
}

@ApiTags("Balances")
@Controller("balances")
@UseGuards(ProfileGuard)
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @Post("deposit/:userId")
  @ApiOperation({ summary: "Deposit money into a user account" })
  @ApiParam({
    name: "userId",
    description: "ID of the user to deposit money to",
    type: String,
  })
  @ApiBody({ type: DepositDto })
  @ApiResponse({
    status: 200,
    description: "Deposit successful",
    schema: {
      properties: {
        status: { type: "string", example: "success" },
        data: {
          type: "object",
          properties: {
            balance: { type: "number", example: 1000 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid amount or deposit limit exceeded",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Only clients can make deposits",
  })
  @ApiResponse({ status: 404, description: "Not found - User not found" })
  async deposit(
    @Param("userId") userId: string,
    @Body() depositDto: DepositDto,
    @Req() req: any
  ) {
    if (!depositDto?.amount) {
      throw new BadRequestException("Amount is required")
    }

    const profile = await this.balancesService.deposit(
      parseInt(userId),
      depositDto.amount,
      req.profile?.id
    )

    return {
      status: "success",
      data: {
        balance: profile.balance,
      },
    }
  }
}
