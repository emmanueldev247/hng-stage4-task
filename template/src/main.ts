import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { requestLogger } from './middleware/request-logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.use(requestLogger);

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Template Service')
    .setDescription('API for managing notification templates')
    .setVersion('1.0.0')
    .addTag('templates')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api/docs', app, document, {
    jsonDocumentUrl: '/api/docs-json',
  });

  const port = process.env.PORT ?? 3002;
  console.log(`Listening on port ${port}`);
  await app.listen(port, '0.0.0.0');
}
bootstrap();
