import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { EmailModule } from './email.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { requestLogger } from './middleware/request-logger';
import { RpcLoggerInterceptor } from './middleware/rpc-logger';
import * as amqp from 'amqplib';

async function ensureTopology(rabbitUrl: string) {
  const EXCHANGE = 'notifications.direct';
  const EXCHANGE_TYPE: 'direct' = 'direct';
  const ROUTING_KEY = 'email.notification';

  const QUEUE = 'email.queue';

  const DLX = 'notifications.direct';
  const DLX_TYPE: 'direct' = 'direct';
  const DLQ = 'failed.queue';
  const DLQ_ROUTING_KEY = 'failed.queue';

  const conn = await amqp.connect(rabbitUrl);
  try {
    const ch = await conn.createChannel();
    await ch.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
    await ch.assertExchange(DLX, DLX_TYPE, { durable: true });

    await ch.assertQueue(QUEUE, {
      durable: true,
      deadLetterExchange: DLX,
      deadLetterRoutingKey: DLQ_ROUTING_KEY,
    });

    await ch.assertQueue(DLQ, { durable: true });
    await ch.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);
    await ch.bindQueue(DLQ, DLX, DLQ_ROUTING_KEY);

    await ch.close();
  } finally {
    await conn.close();
  }
}

async function bootstrap() {
  const app = await NestFactory.create(EmailModule);
  const configService = app.get(ConfigService);

  const rabbitUrl =
    configService.get<string>('RABBITMQ_URL') ||
    'amqp://devuser:devpass@localhost:5672/%2F';

  await ensureTopology(rabbitUrl);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitUrl],
      queue: 'email.queue',
      queueOptions: {
        durable: true,
        deadLetterExchange: 'notifications.direct',
        deadLetterRoutingKey: 'failed.queue',
      },
      noAck: false,
      prefetchCount: 1,
    },
  });

  app.use(requestLogger);
  app.useGlobalInterceptors(new RpcLoggerInterceptor());

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Email Service API')
    .setDescription('Microservice for handling email notifications')
    .setVersion('1.0')
    .addTag('email')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Start microservice before HTTP server
  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3003, '0.0.0.0');

  console.log('🚀 Email Service is running on port 3003');
  console.log('📚 API Documentation: http://localhost:3003/api');
  console.log('✅ Microservice started - listening for RabbitMQ messages');
}

bootstrap();
