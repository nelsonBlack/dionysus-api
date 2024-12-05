import { NestFactory } from "@nestjs/core"
import { Logger } from "@nestjs/common"
import { AppModule } from "./app.module"
import { ValidationPipe } from "@nestjs/common"
import { BadRequestException } from "@nestjs/common"

async function bootstrap() {
  const logger = new Logger("Bootstrap")
  const app = await NestFactory.create(AppModule)
  const port = process.env.PORT || 3001

  await app.listen(port)
  logger.log(`Application is running on: http://localhost:${port}`)
}
bootstrap()
