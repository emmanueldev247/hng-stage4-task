# Push Notification Service API 🚀

## Overview
This project is a robust and scalable real-time push notification service built with **NestJS**, **TypeScript**, and **Node.js**. It leverages **RabbitMQ** for asynchronous message processing, **Redis** for efficient caching and request deduplication, and **Firebase Admin SDK** for reliable push notification delivery. Designed with resilience in mind, it incorporates the **Circuit Breaker pattern** to ensure stability when interacting with external services.

## Features
*   ✨ **Asynchronous Notification Processing**: Utilizes RabbitMQ to asynchronously consume and process push notification requests, ensuring high throughput and decoupled architecture.
*   🚀 **Firebase Push Notification Delivery**: Integrates with Firebase Admin SDK to send targeted push notifications to mobile devices.
*   🛡️ **Circuit Breaker Pattern**: Implements the Opossum Circuit Breaker to enhance resilience and prevent cascading failures when external services (like Firebase) experience issues.
*   ⚡ **Request Deduplication**: Employs Redis caching to prevent duplicate processing of notification requests, improving efficiency and resource utilization.
*   💖 **Health Monitoring**: Provides a simple HTTP endpoint to check the service's operational status.
*   📝 **Configurable**: Environment variables allow easy configuration of messaging queues, caching, and Firebase credentials.

## Getting Started

### Installation
To get this project up and running on your local machine, follow these steps:

*   **Clone the Repository**:
    ```bash
    git clone https://github.com/emmanueldev247/hng-stage4-task.git
    cd hng-stage4-task
    ```
*   **Install Dependencies**:
    ```bash
    npm install
    ```
*   **Build the Project**:
    ```bash
    npm run build
    ```
*   **Start the Application in Development Mode**:
    ```bash
    npm run start:dev
    ```
    Or in production mode:
    ```bash
    npm run start:prod
    ```

### Environment Variables
Create a `.env` file in the root directory and populate it with the following required environment variables:

```dotenv
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost:5672
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"...","universe_domain":"googleapis.com"}
PORT=3004
```

## Usage
This service primarily functions as a microservice consumer for push notification events. Once the service is running and connected to your RabbitMQ instance, it will listen for messages on the `push.queue` with the event pattern `notifications.push`.

To trigger a push notification, publish a message to your RabbitMQ instance targeting the `notifications.push` event. The payload should conform to the `NotificationPayloadDto` structure:

```json
{
  "request_id": "unique-notification-id-123",
  "to": ["device_token_1", "device_token_2"],
  "title": "New Message!",
  "message": "You have a new message from a friend."
}
```

Example of how to publish a message (using `amqplib` in Node.js):

```javascript
const amqp = require('amqplib');

async function sendNotification() {
  const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
  const channel = await connection.createChannel();

  const queue = 'push.queue';
  const eventPattern = 'notifications.push'; // This is the EventPattern in NestJS

  await channel.assertQueue(queue, { durable: true });

  const payload = {
    request_id: 'unique-notification-id-456',
    to: ['device_token_xyz_123', 'device_token_abc_789'], // Replace with actual Firebase device tokens
    title: 'Reminder!',
    message: 'Don\'t forget your meeting at 3 PM today.'
  };

  channel.publish(
    '', // default exchange
    queue, // routing key for the queue
    Buffer.from(JSON.stringify(payload)),
    { persistent: true, headers: { 'x-pattern': eventPattern } } // x-pattern header is important for NestJS microservices
  );

  console.log(`[x] Sent '${JSON.stringify(payload)}'`);
  setTimeout(() => {
    connection.close();
    process.exit(0);
  }, 500);
}

sendNotification().catch(console.error);
```

The service will consume this message, check for deduplication in Redis, and then attempt to send the push notification via Firebase. It includes retry logic and a circuit breaker to handle transient failures gracefully.

## Push Notification Service API

### Overview
This service provides core functionality for handling push notification requests, including receiving events via RabbitMQ, caching processed requests, and dispatching notifications through Firebase, while offering a simple HTTP health check endpoint. It's built with NestJS to ensure a modular and scalable architecture.

### Features
- `NestJS`: Building scalable and maintainable server-side applications.
- `RabbitMQ`: Asynchronous message processing for push notifications.
- `Redis`: Efficient caching for request deduplication.
- `Firebase Admin SDK`: Sending real-time push notifications to devices.
- `Opossum`: Implementing circuit breaker patterns for resilience against external service failures.

### Getting Started
### Installation
To run this API locally, ensure you have Node.js and npm installed.
```bash
# Clone the repository
git clone https://github.com/emmanueldev247/hng-stage4-task.git
cd hng-stage4-task

# Install dependencies
npm install

# Build the project
npm run build

# Start the application in production mode
npm start:prod
```

### Environment Variables
The following environment variables are required to configure the service.
- `REDIS_URL`: URL for the Redis server.
  Example: `REDIS_URL=redis://localhost:6379`
- `RABBITMQ_URL`: URL for the RabbitMQ server.
  Example: `RABBITMQ_URL=amqp://localhost:5672`
- `FIREBASE_SERVICE_ACCOUNT`: A JSON string containing the Firebase service account credentials.
  Example: `FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"my-app","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"...","universe_domain":"googleapis.com"}`
- `PORT`: The port on which the HTTP health check server will listen.
  Example: `PORT=3004`

## API Documentation
### Base URL
The HTTP API root path is `http://localhost:3004` (or `http://0.0.0.0:3004` depending on host configuration).

### Endpoints
#### GET /health
Checks the operational status of the service.

**Request**:
No request body is required.

**Response**:
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

**Errors**:
- `500 Internal Server Error`: An unexpected error occurred while checking the server status.

## Technologies Used

| Technology             | Description                                                               | Link                                                               |
| :--------------------- | :------------------------------------------------------------------------ | :----------------------------------------------------------------- |
| **NestJS**             | A progressive Node.js framework for building efficient and scalable apps. | [NestJS](https://nestjs.com/)                                      |
| **TypeScript**         | A typed superset of JavaScript that compiles to plain JavaScript.         | [TypeScript](https://www.typescriptlang.org/)                      |
| **Node.js**            | A JavaScript runtime built on Chrome's V8 JavaScript engine.              | [Node.js](https://nodejs.org/en/)                                  |
| **RabbitMQ**           | A widely used open source message broker.                                 | [RabbitMQ](https://www.rabbitmq.com/)                              |
| **Redis**              | An open source (BSD licensed), in-memory data structure store.            | [Redis](https://redis.io/)                                         |
| **Firebase Admin SDK** | Enables server-side interaction with Firebase services.                   | [Firebase Admin](https://firebase.google.com/docs/admin/setup)     |
| **Opossum**            | A Circuit Breaker library for Node.js.                                    | [Opossum](https://github.com/nodeshift/opossum)                    |

## Author Info
👋 **Oluwaseyi Oke**

Experienced Software Developer specializing in backend development. Connect with me!

-   **LinkedIn**: [Your LinkedIn Profile](https://linkedin.com/in/oluwaseyi-oke-fullstack-developer)
-   **Portfolio**: [Your Portfolio Website](https://oke-oluwaseyi-portfolio.vercel.app)
-   **Email**: [Your Email Address](mailto:okeoluwaseyimarvellous@gmail.com)

---

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green?logo=node.js&logoColor=white)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.x-red?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-red?logo=rabbitmq&logoColor=white)](https://www.rabbitmq.com/)
[![Redis](https://img.shields.io/badge/Redis-red?logo=redis&logoColor=white)](https://redis.io/)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)](https://github.com/emmanueldev247/hng-stage4-task/actions)
[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)
