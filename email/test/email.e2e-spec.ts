// test/email.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '../src/services/email.service';
import { SendGridService } from '../src/services/sendgrid.service';
import { CircuitBreakerService } from '../src/services/circuit-breaker.service';
import { RedisService } from '../src/services/redis.service';
import { ConfigService } from '@nestjs/config';

describe('EmailService', () => {
  let emailService: EmailService;
  let sendGridService: SendGridService;
  let circuitBreakerService: CircuitBreakerService;
  let redisService: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: SendGridService,
          useValue: {
            sendEmail: jest.fn(),
          },
        },
        {
          provide: CircuitBreakerService,
          useValue: {
            canExecute: jest.fn().mockReturnValue(true),
            onSuccess: jest.fn(),
            onFailure: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    emailService = module.get<EmailService>(EmailService);
    sendGridService = module.get<SendGridService>(SendGridService);
    circuitBreakerService = module.get<CircuitBreakerService>(CircuitBreakerService);
    redisService = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(emailService).toBeDefined();
  });

  describe('processEmailNotification', () => {
    it('should process email notification successfully', async () => {
      const mockData = {
        notification_type: 'email',
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        template_code: 'welcome',
        variables: {
          name: 'John Doe',
          link: 'https://example.com',
        },
        request_id: 'req-123',
      };

      jest.spyOn(redisService, 'get').mockResolvedValue(null);
      jest.spyOn(sendGridService, 'sendEmail').mockResolvedValue(true);

      await expect(emailService.processEmailNotification(mockData as any)).resolves.not.toThrow();
      
      expect(redisService.set).toHaveBeenCalled();
      expect(circuitBreakerService.onSuccess).toHaveBeenCalled();
    });
  });
});