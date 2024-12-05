import {
  Controller,
  Get,
  Query,
  BadRequestException,
  Logger,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Req,
} from "@nestjs/common"
import { AdminService } from "../services/admin.service"
import { GetBestProfessionDto } from "../dto/get-best-profession.dto"
import { GetBestClientsDto } from "../dto/get-best-clients.dto"
import { ProfileGuard } from "../../../common/guards/profile.guard"
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiQuery,
} from "@nestjs/swagger"

@ApiTags("Admin")
@Controller("admin")
@UseGuards(ProfileGuard)
@ApiSecurity("profile_id")
export class AdminController {
  private readonly logger = new Logger(AdminController.name)
  constructor(private readonly adminService: AdminService) {}

  @Get("best-profession")
  @ApiOperation({ summary: "Get the highest earning profession" })
  @ApiResponse({
    status: 200,
    description: "Returns the profession with highest earnings",
    schema: {
      example: {
        profession: "Developer",
        earned: 2500.5,
      },
    },
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 400, description: "Bad Request" })
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      stopAtFirstError: false,
    })
  )
  async getBestProfession(@Query() query: GetBestProfessionDto, @Req() req) {
    const start = new Date(query.start)
    const end = new Date(query.end)

    start.setUTCHours(0, 0, 0, 0)
    end.setUTCHours(23, 59, 59, 999)

    return this.adminService.getBestProfession(start, end)
  }

  @Get("best-clients")
  @ApiOperation({ summary: "Get the clients who paid the most" })
  @ApiResponse({
    status: 200,
    description: "Returns list of top paying clients",
    schema: {
      example: [
        {
          id: 1,
          fullName: "John Doe",
          paid: 2500.5,
        },
      ],
    },
  })
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      stopAtFirstError: false,
    })
  )
  async getBestClients(@Query() query: GetBestClientsDto) {
    const start = new Date(query.start)
    const end = new Date(query.end)

    start.setUTCHours(0, 0, 0, 0)
    end.setUTCHours(23, 59, 59, 999)

    return this.adminService.getBestClients(start, end, query.limit)
  }
}
