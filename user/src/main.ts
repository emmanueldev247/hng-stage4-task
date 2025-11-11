import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
<<<<<<< HEAD
import { ValidationPipe } from '@nestjs/common';
=======
import { ValidationPipe } from '@nestjs/common'; // <-- IMPORT THIS
<<<<<<< HEAD
>>>>>>> 65208b1 (feat(user-service): add coplete user service API (untested))
=======
>>>>>>> b78dd23 (feat(user-service): add coplete user service API (untested))
>>>>>>> eacfed9 (feat(user-service): add coplete user service API (untested))

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation for all DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip away properties that are not in the DTO
      forbidNonWhitelisted: true, // Throw error if unknown properties are sent
    }),
  );

  await app.listen(3000);
}
bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1); // Exit  process if startup fails
});
