import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { FirebaseService } from 'src/firebase/firebase.provider';
import { NotificationHandler } from './notification.handler';

@Module({
  controllers: [NotificationHandler],
  providers: [NotificationService, FirebaseService],
})
export class NotificationModule {}
