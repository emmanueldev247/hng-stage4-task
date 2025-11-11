// src/main.ts
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { EmailModule } from './email.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(EmailModule);
  const configService = app.get(ConfigService);

  const rabbitmqUrl = configService.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672';
  
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: 'email.queue',
      queueOptions: {
        durable: true,
        deadLetterExchange: 'notifications.direct',
        deadLetterRoutingKey: 'failed.queue',
      },
      noAck: false,
      // Add these options for better pattern matching
      prefetchCount: 1,
      socketOptions: {
        heartbeatIntervalInSeconds: 60,
        reconnectTimeInSeconds: 5,
      },
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

  await app.startAllMicroservices();
  await app.listen(3001);
  
  console.log('Email Service is running on port 3001');
  console.log('Swagger documentation available at http://localhost:3001/api');
}
bootstrap();