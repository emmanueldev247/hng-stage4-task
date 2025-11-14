import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { randomUUID } from 'node:crypto';
import { TemplateClient, UserClient } from 'src/clients';
import { TemplateDto } from 'src/modules/template/dto';
import { finalize } from 'rxjs/operators';
import { CreateNotificationDto } from './dto';
import { NotificationType } from './dto/notification-type.enum';

type LegacyBody = {
  template_code: string;
  variables: Record<string, any>;
};

type UnifiedBody = CreateNotificationDto | LegacyBody;

@Injectable()
export class NotificationService {
  private readonly logger = new Logger('RMQ-PUB');

  constructor(
    @Inject('EMAIL_CLIENT') private emailClient: ClientProxy,
    @Inject('PUSH_CLIENT') private pushClient: ClientProxy,
    private userClient: UserClient,
    private templateClient: TemplateClient,
  ) {}

  private emitLogged(client: ClientProxy, pattern: string, data: any) {
    const started = Date.now();
    this.logger.log(
      `⇢ emit ${pattern} req=${data?.request_id ?? '-'} to=${data?.to ?? '-'}`,
    );
    client
      .emit(pattern, data)
      .pipe(
        finalize(() =>
          this.logger.log(`⇠ emit ${pattern} done ${Date.now() - started}ms`),
        ),
      )
      .subscribe();
  }

  private transformTemplate(
    template: TemplateDto,
    variables: Record<string, string>,
  ) {
    const bodyPlaceholders = Array.from(
      template.body.matchAll(/{{\s*(\w+)\s*}}/g),
    ).map((m) => m[1]);
    const subjectPlaceholders = Array.from(
      template.subject.matchAll(/{{\s*(\w+)\s*}}/g),
    ).map((m) => m[1]);
    const allPlaceholders = [
      ...new Set([...bodyPlaceholders, ...subjectPlaceholders]),
    ];

    const missing = allPlaceholders.filter((k) => !(k in variables));
    const extra = Object.keys(variables).filter(
      (k) => !allPlaceholders.includes(k),
    );

    if (missing.length)
      throw new BadRequestException(`Missing variables: ${missing.join(', ')}`);
    if (extra.length)
      this.logger.warn(`Extra variables provided: ${extra.join(', ')}`);

    let body = template.body;
    for (const key of bodyPlaceholders) {
      body = body.replace(
        new RegExp(`{{\\s*${key}\\s*}}`, 'g'),
        variables[key] ?? '',
      );
    }

    let subject = template.subject;
    for (const key of subjectPlaceholders) {
      subject = subject.replace(
        new RegExp(`{{\\s*${key}\\s*}}`, 'g'),
        variables[key] ?? '',
      );
    }

    return { subject, body };
  }

  async sendNotification(
    effectiveUserId: string | undefined,
    raw: UnifiedBody,
  ) {
    const isLegacy = !('notification_type' in raw) && !('request_id' in raw);
    const dto: CreateNotificationDto = isLegacy
      ? ({
          template_code: (raw as LegacyBody).template_code,
          variables: (raw as LegacyBody).variables,
        } as CreateNotificationDto)
      : (raw as CreateNotificationDto);

    if (!effectiveUserId) {
      throw new BadRequestException(
        'No user context. Provide JWT or a user_id in the request.',
      );
    }

    if (dto.notification_type !== undefined && dto.notification_type !== null) {
      const allowed = Object.values(NotificationType);
      if (!allowed.includes(dto.notification_type as any)) {
        throw new BadRequestException(
          `Invalid notification_type: '${dto.notification_type}'. Allowed values: ${allowed.join(', ')}`,
        );
      }
    }

    const request_id = dto.request_id?.trim() || randomUUID();

    // Fetch user contact + preferences
    const user = await this.userClient.getContactInfo(effectiveUserId);
    const { email, preferences, device_tokens, name } = user.data;

    // Build content from template
    const template = await this.templateClient.getTemplate(dto.template_code);
    const vars = { ...(dto.variables || {}), name };
    const { subject, body } = this.transformTemplate(template.data, vars);

    let wantEmail = false;
    let wantPush = false;

    if (dto.notification_type === NotificationType.email) {
      wantEmail = true;
    } else if (dto.notification_type === NotificationType.push) {
      wantPush = true;
    } else {
      wantEmail = !!preferences?.email_notifications;
      wantPush = !!preferences?.push_notifications;
    }

    // 4) Validate feasibility of chosen channels
    if (!wantEmail && !wantPush) {
      throw new BadRequestException(
        'No delivery channel selected: provide notification_type OR enable at least one preference.',
      );
    }

    if (wantEmail && !email) {
      throw new BadRequestException(
        'Email channel selected but user has no email on file.',
      );
    }

    if (wantPush) {
      if (!Array.isArray(device_tokens) || device_tokens.length === 0) {
        throw new BadRequestException(
          'Push channel selected but user has no device tokens.',
        );
      }
    }

    if (wantEmail) {
      this.emitLogged(this.emailClient, 'notifications.email', {
        request_id,
        to: email,
        subject,
        body,
        metadata: dto.metadata,
        priority: dto.priority ?? 5,
      });
    }

    if (wantPush) {
      this.emitLogged(this.pushClient, 'notifications.push', {
        request_id,
        to: device_tokens,
        title: subject,
        body,
        metadata: dto.metadata,
        priority: dto.priority ?? 5,
      });
    }

    if (wantPush && (!device_tokens || device_tokens.length === 0)) {
      this.logger.warn(
        `⏭️ Skipping push: forced=push but user has 0 tokens (user_id=${effectiveUserId})`,
      );
    }
    if (wantEmail && !email) {
      this.logger.warn(
        `⏭️ Skipping email: forced=email but user has no email (user_id=${effectiveUserId})`,
      );
    }

    return {
      success: true,
      message: 'Notification dispatched successfully',
      notification_id: request_id,
      channels: {
        email: wantEmail,
        push: wantPush,
      },
    };
  }
}
