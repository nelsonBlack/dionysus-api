import {
  Controller,
  Get,
  Query,
  BadRequestException,
  Logger,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common"
import { AdminService } from "../services/admin.service"
import { GetBestProfessionDto } from "../dto/get-best-profession.dto"
import { GetBestClientsDto } from "../dto/get-best-clients.dto"

@Controller("admin")
export class AdminController {
  private readonly logger = new Logger(AdminController.name)
  constructor(private readonly adminService: AdminService) {}

  @Get("best-profession")
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      stopAtFirstError: false,
    })
  )
  async getBestProfession(@Query() query: GetBestProfessionDto) {
    const start = new Date(query.start)
    const end = new Date(query.end)

    start.setUTCHours(0, 0, 0, 0)
    end.setUTCHours(23, 59, 59, 999)

    return this.adminService.getBestProfession(start, end)
  }

  @Get("best-clients")
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
