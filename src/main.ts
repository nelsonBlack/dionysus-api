import { NestFactory } from "@nestjs/core"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import { ValidationPipe } from "@nestjs/common"
import { AppModule } from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle("DEEL API")
    .setDescription("DEEL Backend Task API Documentation")
    .setVersion("1.0")
    .addApiKey(
      { type: "apiKey", name: "profile_id", in: "header" },
      "profile_id"
    )
    .addTag("Contracts", "Contract management endpoints")
    .addTag("Jobs", "Job management endpoints")
    .addTag("Balances", "Balance operations endpoints")
    .addTag("Admin", "Admin operations endpoints")
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup("api-docs", app, document)

  app.useGlobalPipes(new ValidationPipe())
  await app.listen(3001)
}
bootstrap()
