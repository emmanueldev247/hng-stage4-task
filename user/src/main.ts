import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { requestLogger } from "./middleware/request-logger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation for all DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  app.use(requestLogger);

  const config = new DocumentBuilder()
    .setTitle("User Service API")
    .setDescription("API documentation for the HNG Stage 4 User Service")
    .setVersion("1.0")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(process.env.PORT ?? 3001, "0.0.0.0");
}
bootstrap().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
