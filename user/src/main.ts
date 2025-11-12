import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation for all DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip away properties that are not in the DTO
      forbidNonWhitelisted: true, // Throw error if unknown properties are sent
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1); // Exit  process if startup fails
});
