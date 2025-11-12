import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { EmailModule } from './email.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(EmailModule);
  const configService = app.get(ConfigService);

  // RabbitMQ Microservice Configuration
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get('RABBITMQ_URL') || 'amqp://localhost:5672'],
      queue: 'email.queue',
      queueOptions: {
        durable: true,
        deadLetterExchange: 'notifications.direct',
        deadLetterRoutingKey: 'failed.queue',
      },
      noAck: false,
    },
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Email Service API')
    .setDescription('Microservice for handling email notifications')
    .setVersion('1.0')
    .addTag('email')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Start microservice before HTTP server
  await app.startAllMicroservices();
  await app.listen(3001);
  
  console.log('🚀 Email Service is running on port 3001');
  console.log('📚 API Documentation: http://localhost:3001/api');
  console.log('✅ Microservice started - listening for RabbitMQ messages');
}

bootstrap();