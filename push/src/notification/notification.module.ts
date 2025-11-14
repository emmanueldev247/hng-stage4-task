import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { FirebaseService } from 'src/firebase/firebase.provider';
import { NotificationHandler } from './notification.handler';
import { StatusReporterService } from './status-reporter.service';

@Module({
  controllers: [NotificationHandler],
  providers: [NotificationService, FirebaseService, StatusReporterService],
})
export class NotificationModule {}
