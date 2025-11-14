import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { requestLogger } from './middleware/request-logger';
import { RpcLoggerInterceptor } from './middleware/rpc-logger';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [config.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672'],
      queue: 'push.queue',
      queueOptions: {
        durable: true,
        deadLetterExchange: 'notifications.direct',
        deadLetterRoutingKey: 'notifications.failed',
      },
      noAck: false,
    },
  });

  app.use(requestLogger);
  app.useGlobalInterceptors(new RpcLoggerInterceptor());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Swagger setup
  const swaggerCfg = new DocumentBuilder()
    .setTitle('Push Service API')
    .setDescription('Endpoints for testing push notifications')
    .setVersion('1.0.0')
    .addTag('push')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerCfg);
  SwaggerModule.setup('api/docs', app, document);

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3004, '0.0.0.0');
}
bootstrap();
