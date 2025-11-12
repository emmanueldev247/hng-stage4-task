import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
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

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
