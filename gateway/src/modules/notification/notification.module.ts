import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { TemplateClient, UserClient } from 'src/clients';
import { OptionalRestAuthGuard } from '../auth/guards/optional-rest.guard';
import { NotificationStatusController } from './notification-status.controller';
import { NotificationStatusService } from './notification-status.service';
import { StatusSecretGuard } from './status-secret.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET') || 'dev-secret',
      }),
    }),

    ClientsModule.registerAsync([
      {
        name: 'EMAIL_CLIENT',
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              config.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672',
            ],
            queue: 'email.queue',
            queueOptions: {
              durable: true,
              arguments: {
                'x-dead-letter-exchange': 'notifications.direct',
                'x-dead-letter-routing-key': 'failed.queue',
              },
            },

            persistent: true,
          },
        }),
      },

      {
        name: 'PUSH_CLIENT',
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              config.get<string>('RABBITMQ_URL') || 'amqp://localhost:5672',
            ],
            queue: 'push.queue',

            queueOptions: {
              durable: true,
              arguments: {
                'x-dead-letter-exchange': 'notifications.direct',
                'x-dead-letter-routing-key': 'notifications.failed',
              },
            },
            persistent: true,
          },
        }),
      },
    ]),
  ],
  controllers: [NotificationController, NotificationStatusController],
  providers: [
    NotificationService,
    UserClient,
    TemplateClient,
    NotificationStatusService,
    StatusSecretGuard,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
