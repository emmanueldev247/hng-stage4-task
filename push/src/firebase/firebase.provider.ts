import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  constructor(private config: ConfigService) {}

  onModuleInit() {
    if (admin.apps.length === 0) {
      const serviceAccountPath =
        this.config.get<string>('FIREBASE_CREDENTIALS_PATH') ||
        'src/firebase/firebase-service-account.json';

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
      });

      this.logger.log('Firebase Admin initialized');
    }
  }

  async sendPushNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    if (!tokens.length) return;

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: { title, body },
      data,
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    // Remove invalid tokens
    const invalidTokens = response.responses
      .map((res, i) => (!res.success ? tokens[i] : null))
      .filter(Boolean) as string[];

    if (invalidTokens.length > 0) {
      this.logger.warn(`Removing ${invalidTokens.length} invalid tokens`);
      // If there's time make an event called invalid token that is received by user service to remove the token from the user tokens
    }

    return response;
  }
}
