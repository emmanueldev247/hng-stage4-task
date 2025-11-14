import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { requestLogger } from './middleware/request-logger';
import { RpcLoggerInterceptor } from './middleware/rpc-logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1', {
    exclude: ['/health'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(requestLogger);
  app.useGlobalInterceptors(new RpcLoggerInterceptor());

  const port = process.env.PORT ?? 3000;
  const fcmHelperUrl = process.env.FCM_HELPER_URL ?? `http://localhost:${port}/fcm`;

  const config = new DocumentBuilder()
    .setTitle('Notification Application')
    .setDescription(
      [
        'Notification Application API Documentation.',
        `Need an FCM device token for push tests? Open ${fcmHelperUrl} to grant permission, copy the token, and follow the instructions on the page.`,
      ].join('\n\n'),
    )
    .setVersion('1.0')
    .addBearerAuth()
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory, {
    jsonDocumentUrl: 'swagger/json',
  });

  const http = app.getHttpAdapter();

  // redirect legacy /api/v1/docs → /api/docs
  http.get('/api/v1/docs', (req, res) => {
    res.redirect(302, '/api/docs');
  });

  await app.listen(port, '0.0.0.0');
}
bootstrap();
