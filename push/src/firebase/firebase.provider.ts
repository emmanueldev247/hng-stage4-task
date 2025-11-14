import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

interface FirebaseServiceAccount {
  project_id: string;
  private_key: string;
  client_email: string;
}

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
      const rawConfig = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT');

      if (!rawConfig) {
        throw new Error(
          'Missing FIREBASE_SERVICE_ACCOUNT in environment variables',
        );
      }

      const firebaseConfig = JSON.parse(rawConfig) as FirebaseServiceAccount;

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
    const unique = Array.from(new Set(tokens)).filter(Boolean);
    if (!unique.length) return;

    const message: admin.messaging.MulticastMessage = {
      tokens: unique,
      notification: { title, body: this.stripHtml(body) }, // strip HTML
      data,
    };

    const resp = await admin.messaging().sendEachForMulticast(message);

    const invalid: string[] = [];
    resp.responses.forEach((r, i) => {
      const token = unique[i];
      if (!r.success) {
        const code = (r.error as any)?.code ?? 'unknown';
        const msg = (r.error as any)?.message ?? String(r.error);
        this.logger.warn(
          `FCM error for token=${token}: code=${code} msg=${msg}`,
        );

        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          invalid.push(token);
        }
      }
    });

    if (invalid.length > 0) {
      this.logger.warn(`Removing ${invalid.length} invalid tokens`);
    }

    return resp;
  }

  // --- helper: HTML stripper for push notifications
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
