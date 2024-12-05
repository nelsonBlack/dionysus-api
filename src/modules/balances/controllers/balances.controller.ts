import { Controller, Post, Param, Body, UseGuards, Req } from "@nestjs/common"
import { ProfileGuard } from "../../../common/guards/profile.guard"
import { BalancesService } from "../services/balances.service"

class DepositDto {
  amount: number;
}

@Controller('balances')
@UseGuards(ProfileGuard)
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @Post('deposit/:userId')
  async deposit(
    @Param('userId') userId: string,
    @Body() depositDto: DepositDto,
    @Req() req: any
  ) {
    const profile = await this.balancesService.deposit(
      parseInt(userId),
      depositDto.amount,
      req.profile.id
    );

    return {
      status: "success",
      data: {
        balance: profile.balance
      }
    };
  }
} 