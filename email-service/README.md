# Email Service Microservice

A robust, fault-tolerant email notification microservice built with NestJS, designed to handle asynchronous email delivery through RabbitMQ message queues. Part of a distributed notification system.

## 🚀 Features

- **Asynchronous Processing**: RabbitMQ message queue integration for reliable email delivery
- **SendGrid Integration**: Professional email delivery with retry mechanisms
- **Circuit Breaker Pattern**: Prevents cascading failures when external services are down
- **Idempotency**: Prevents duplicate email sends using Redis
- **Health Monitoring**: Comprehensive health check endpoints
- **Dead Letter Queue**: Handles failed messages gracefully
- **Docker Ready**: Containerized for easy deployment
- **API Documentation**: Auto-generated Swagger/OpenAPI docs

## 🏗️ System Architecture

## 📁 Project Structure
email-service/
├── src/
│ ├── controllers/
│ │ ├── email.controller.ts
│ │ └── health.controller.ts
│ ├── dtos/
│ │ ├── notification.dto.ts
│ │ └── response.dto.ts
│ ├── services/
│ │ ├── email.service.ts
│ │ ├── sendgrid.service.ts
│ │ ├── circuit-breaker.service.ts
│ │ └── redis.service.ts
│ ├── email.module.ts
│ └── main.ts
├── test/
│ ├── email.service.spec.ts
│ └── app.e2e-spec.ts
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
├── .env
└── README.md

text

## 📋 Prerequisites

- Node.js 18+
- RabbitMQ
- Redis
- SendGrid account (optional for development)

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd hng-stage4-task/email-service
Install dependencies

bash
npm install
Set up environment variables

bash
cp .env.example .env
# Edit .env with your configuration
⚙️ Configuration
Environment Variables
env
# Service Configuration
NODE_ENV=development
PORT=3001

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# SendGrid (Optional for development)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourapp.com

# Redis
REDIS_URL=redis://localhost:6379

# External Services (For future integration)
USER_SERVICE_URL=http://localhost:3002
TEMPLATE_SERVICE_URL=http://localhost:3003
Development without SendGrid
The service runs in development mode without a SendGrid API key, logging emails instead of sending them.

🚀 Quick Start
Using Docker (Recommended)
bash
# Start all dependencies
docker-compose up -d rabbitmq redis

# Start the service
npm run start:dev
Manual Setup
Start RabbitMQ

bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
Start Redis

bash
docker run -d --name redis -p 6379:6379 redis:alpine
Run the service

bash
npm run start:dev
📡 API Usage
Message Format
Send messages to RabbitMQ queue email.queue with this format:

json
{
  "notification_type": "email",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "template_code": "welcome",
  "variables": {
    "name": "John Doe",
    "link": "https://example.com"
  },
  "request_id": "unique-request-id-123",
  "priority": 1,
  "metadata": {
    "campaign": "welcome_series"
  }
}
Available Templates
welcome - Welcome email for new users

reset_password - Password reset instructions

notification - General notifications

Health Endpoints
GET /health - Basic service health

GET /health/detailed - Detailed health with dependencies

API Documentation
Swagger UI available at: http://localhost:3001/api

🔧 Development
Available Scripts
bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod

# Testing
npm test
npm run test:e2e
npm run test:cov

# Code quality
npm run lint
npm run format
Testing the Service
Start the service

bash
npm run start:dev
Send test message

bash
npx ts-node test-send-message.ts
Check logs for processing

bash
# Should see in logs:
# [EmailController] Received email notification: test-request-xxx
# [SendGridService] Email sent successfully to: user-xxx@example.com
# [EmailService] Email notification processed successfully: test-request-xxx
🧪 Testing
Test Scripts
test-send-message.ts

typescript
import * as amqp from 'amqplib';

async function sendTestMessage() {
  const connection = await amqp.connect('amqp://localhost:5672');
  const channel = await connection.createChannel();
  
  const message = {
    notification_type: 'email',
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    template_code: 'welcome',
    variables: {
      name: 'John Doe',
      link: 'https://example.com',
    },
    request_id: 'test-request-' + Date.now(),
    priority: 1,
  };

  await channel.assertExchange('notifications.direct', 'direct', { durable: true });
  channel.publish('notifications.direct', 'email.queue', Buffer.from(JSON.stringify(message)));
  
  console.log('✅ Test message sent');
  await channel.close();
  await connection.close();
}

sendTestMessage();
🔒 Resilience Features
Circuit Breaker
Opens after 5 consecutive failures

Resets after 60 seconds

Prevents cascading failures

Retry Mechanism
Exponential backoff (1s, 2s, 4s)

Maximum 3 retry attempts

Failed messages go to DLQ

Idempotency
Redis-based request ID tracking

24-hour duplicate prevention

Exactly-once delivery semantics

🐳 Docker Deployment
docker-compose.yml
yaml
version: '3.8'
services:
  email-service:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - RABBITMQ_URL=amqp://rabbitmq:5672
      - REDIS_URL=redis://redis:6379
    depends_on:
      - rabbitmq
      - redis

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      - RABBITMQ_DEFAULT_USER=guest
      - RABBITMQ_DEFAULT_PASS=guest

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
Dockerfile
dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "run", "start:prod"]
📊 Monitoring & Logging
Health Checks
bash
curl http://localhost:3001/health
curl http://localhost:3001/health/detailed
RabbitMQ Management
URL: http://localhost:15672

Username: guest

Password: guest

Log Structure
text
[EmailService] Processing notification: request-123
[SendGridService] Email sent to: user@example.com
[CircuitBreaker] Circuit opened for sendgrid
[RedisService] Cached request: request-123
🤝 Team Integration
Message Queue Structure
text
Exchange: notifications.direct
├── email.queue  → Email Service
├── push.queue   → Push Service
└── failed.queue → Dead Letter Queue
Required Integrations
User Service: User email lookup endpoint

Template Service: Dynamic template retrieval

API Gateway: Request routing and validation

Response Format
typescript
{
  success: boolean;
  data?: T;
  error?: string;
  message: string;
  meta?: {
    total: number;
    limit: number;
    page: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  }
}
🚨 Error Handling
Failure Scenarios
SendGrid Outage: Circuit breaker opens, messages queued

Redis Unavailable: Fallback to in-memory cache

RabbitMQ Connection Lost: Automatic reconnection

Invalid Messages: Sent to dead letter queue

Dead Letter Queue
Exchange: notifications.direct

Routing Key: failed.queue

Manual intervention required for DLQ messages

📈 Performance Targets
✅ 1000+ notifications per minute

✅ API response under 100ms

✅ 99.5% delivery success rate

✅ Horizontal scaling support

🔍 Debugging
Common Issues
RabbitMQ Connection: Check if RabbitMQ is running on port 5672

Redis Connection: Verify Redis on port 6379

SendGrid API: Validate API key and from email

Message Format: Ensure correct JSON structure

Debug Commands
bash
# Check service status
docker ps

# View logs
docker logs <container_id>

# Test connectivity
telnet localhost 5672  # RabbitMQ
telnet localhost 6379  # Redis

# Purge queues (if needed)
rabbitmqadmin purge queue name=email.queue
📋 TODO Before Production
Integrate with User Service for email lookup

Integrate with Template Service for dynamic templates

Add rate limiting and throttling

Implement comprehensive monitoring

Add alerting for failures

Set up CI/CD pipeline

Add security headers

Implement request validation

👥 Team Coordination
Dependencies
API Gateway: Routes email requests to correct queue

User Service: Provides user email addresses

Template Service: Provides email templates

Push Service: Parallel notification service

Integration Points
typescript
// User Service Integration
GET /api/v1/users/{user_id}/email

// Template Service Integration  
GET /api/v1/templates/{template_code}
📞 Support
Troubleshooting Steps
Check health endpoints: http://localhost:3001/health

Verify RabbitMQ queue status: http://localhost:15672

Check service logs for errors

Review dead letter queue for failed messages

Test with sample message using test script

Getting Help
Check service documentation at http://localhost:3001/api

Review RabbitMQ management console

Examine application logs for detailed errors

📄 License
This project is part of the HNG Stage 4 Backend Task - Distributed Notification System.

Built with ❤️ using NestJS, RabbitMQ, Redis, and SendGrid

Part of a microservices architecture for scalable notification delivery
