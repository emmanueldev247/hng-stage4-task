import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  constructor(private config: ConfigService) {}

  onModuleInit() {
    try {
      if (admin.apps.length > 0) {
        this.logger.log('Firebase Admin already initialized');
        return;
      }

      const firebaseConfig = this.config.get<Record<string, any>>(
        'FIREBASE_SERVICE_ACCOUNT',
      );

      if (!firebaseConfig) {
        this.logger.warn(
          'FIREBASE_SERVICE_ACCOUNT not found — skipping Firebase initialization.',
        );
        return;
      }

      if (
        !firebaseConfig.project_id ||
        !firebaseConfig.private_key ||
        !firebaseConfig.client_email
      ) {
        this.logger.error(
          'Invalid FIREBASE_SERVICE_ACCOUNT format — missing required fields.',
        );
        return;
      }

      admin.initializeApp({
        credential: admin.credential.cert(
          firebaseConfig as admin.ServiceAccount,
        ),
      });

      this.logger.log('✅ Firebase Admin initialized successfully');
    } catch (error) {
      this.logger.error(`Firebase initialization failed: ${error}`);
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
