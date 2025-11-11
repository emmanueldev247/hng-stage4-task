# Email Service Microservice

A robust, fault-tolerant email notification microservice built with NestJS. It handles asynchronous email delivery through RabbitMQ message queues as part of a distributed notification system.

## 🚀 Features

- **Asynchronous Processing**: RabbitMQ integration for reliable, non-blocking email delivery.
- **SendGrid Integration**: Professional email delivery with retry mechanisms
- **Circuit Breaker Pattern**: Prevents cascading failures when external services are down
- **Idempotency**: Prevents duplicate email sends using Redis
- **Health Monitoring**: Comprehensive health check endpoints
- **Dead Letter Queue**: Handles failed messages gracefully
- **Docker Ready**: Containerized for easy deployment
- **API Documentation**: Auto-generated Swagger/OpenAPI docs

## 🏗️ System Architecture
_(This section can be expanded with diagrams and detailed explanations of the microservice's role in the larger system.)_

## 📁 Project Structure
email/
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

## 🛠️ Setup

### 1. Prerequisites

- Node.js (v18+)
- Docker & Docker Compose
- SendGrid Account (optional for development, emails will be logged to the console)

### 2. Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd hng-stage4-task/email-service

# 2. Install dependencies
npm install
```

### 3. Configuration

Create a `.env` file from the example and fill in your details.

```bash
cp .env.example .env
```

**`.env` Variables:**
```env
# Service Configuration
NODE_ENV=development
PORT=3001

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# SendGrid (Optional for development)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourapp.com

# Redis
REDIS_URL=redis://localhost:6379
```
> **Note**: The service can run without a `SENDGRID_API_KEY`. In this mode, emails are logged to the console instead of being sent.

### 4. Running the Service

**Using Docker (Recommended):**

This command starts the email service along with its dependencies (RabbitMQ and Redis).

```bash
docker-compose up -d
```

**Manual Setup:**

If you prefer not to use Docker Compose, you can run the dependencies and the app separately.

```bash
# 1. Start RabbitMQ
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# 2. Start Redis
docker run -d --name redis -p 6379:6379 redis:7-alpine

# 3. Run the service
npm run start:dev
```

## 📡 API Reference

This service does not expose a public HTTP API for sending emails. Instead, it consumes messages from a RabbitMQ queue.

### Message Format

To trigger an email, publish a message to the `notifications.direct` exchange with the routing key `email.queue`.

**Payload Structure:**
```json
{
  "pattern": { "cmd": "email_notification" },
  "data": {
    "notification_type": "email",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "template_code": "welcome",
    "variables": {
      "name": "John Doe",
      "link": "https://example.com"
    },
    "request_id": "unique-request-id-123",
    "priority": 1
  }
}
```

### Available Templates

- `welcome`: Welcome email for new users.
- `reset_password`: Password reset instructions.

### Health Endpoints

The service exposes HTTP endpoints for health monitoring.

- `GET /health`: Basic service health check.
- `GET /health/detailed`: Detailed health check including dependencies (Redis, SendGrid).

### API Documentation

Swagger UI is available at `http://localhost:3001/api` for exploring the health endpoints.

## 💻 Development Workflow

### Available Scripts

```bash
# Run in development mode with hot-reloading
npm run start:dev

# Build for production
npm run build

# Run in production mode
npm run start:prod

# Run unit tests
npm test

# Run end-to-end tests
npm run test:e2e

# Run code linter
npm run lint
```

### Sending a Test Message

A helper script is provided to send a test message to the RabbitMQ queue.

```bash
# Ensure the service is running first
npm run start:dev

# In a new terminal, send the test message
npx ts-node test-send-message.ts
```

You should see log output in the service terminal confirming the message was received and processed.

**`test-send-message.ts`**
```typescript
import * as amqp from 'amqplib';

async function sendTestMessage() {
  const connection = await amqp.connect('amqp://localhost:5672');
  const channel = await connection.createChannel();
  
  const message = { // NestJS microservice expects this format
    pattern: { cmd: 'email_notification' },
    data: {
      notification_type: 'email',
      user_id: '123e4567-e89b-12d3-a456-426614174000',
      template_code: 'welcome',
      variables: { name: 'John Doe', link: 'https://example.com' },
      request_id: 'test-request-' + Date.now(),
      priority: 1,
    },
  };

  await channel.assertExchange('notifications.direct', 'direct', { durable: true });
  channel.publish('notifications.direct', 'email.queue', Buffer.from(JSON.stringify(message)));
  
  console.log('✅ Test message sent');
  await channel.close();
  await connection.close();
}

sendTestMessage();
```

### Debugging

- **RabbitMQ Connection**: Ensure RabbitMQ is running on port `5672`. Check credentials in `.env`.
- **Redis Connection**: Verify Redis is running on port `6379`.
- **Message Format**: Double-check that the message published to RabbitMQ matches the specified format.
- **Service Logs**: Use `docker logs <container_id>` to view detailed logs from the service.

## 🚢 Deployment

### Docker

The service is containerized for easy and consistent deployments. The `docker-compose.yml` file orchestrates the service and its dependencies.

**`docker-compose.yml`**
```yaml
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
```

**`Dockerfile`**
```dockerfile
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
