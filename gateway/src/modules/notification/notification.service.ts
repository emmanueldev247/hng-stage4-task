import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { randomUUID } from 'node:crypto';
import { NotificationDto } from './dto/notification.dto';
import { TemplateClient, UserClient } from 'src/clients';
import { TemplateDto } from 'src/common/dto';

@Injectable()
export class NotificationService {
  constructor(
    @Inject('NOTIFICATION_SERVICE') private client: ClientProxy,
    private userClient: UserClient,
    private templateClient: TemplateClient,
  ) {}

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

    const missing = allPlaceholders.filter((key) => !(key in variables));
    const extra = Object.keys(variables).filter(
      (k) => !allPlaceholders.includes(k),
    );

    if (missing.length > 0) {
      throw new BadRequestException(`Missing variables: ${missing.join(', ')}`);
    }

    if (extra.length > 0) {
      console.warn(`Warning: extra variables provided: ${extra.join(', ')}`);
    }

    let body = template.body;
    bodyPlaceholders.forEach((key) => {
      const value = variables[key] ?? '';
      body = body.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value);
    });

    let subject = template.subject;
    subjectPlaceholders.forEach((key) => {
      const value = variables[key] ?? '';
      subject = subject.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value);
    });

    return { subject, body };
  }

  async sendNotification(user_id: string, data: NotificationDto) {
    const { template_code, variables } = data;
    const request_id = randomUUID();
    const user = await this.userClient.getUserInfo(user_id);
    const { email, preferences, device_tokens, name } = user;
    const template = await this.templateClient.getTemplate(template_code);
    const vars = { ...variables, name };
    const { subject, body } = this.transformTemplate(template, vars);
    if (preferences.email_notifications) {
      this.client.emit('notifications.email', {
        request_id,
        to: email,
        subject,
        body,
      });
    }
    if (preferences.push_notifications) {
      this.client.emit('notifications.push', {
        request_id,
        to: device_tokens,
        title: subject,
        body,
      });
    }
    return {
      success: true,
      message: 'Notification dispatched successfully',
    };
  }
}
