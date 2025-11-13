# Gateway API

## Overview
This project is a TypeScript Node.js API Gateway built with NestJS. It acts as a central entry point, routing requests to various internal microservices (User Service, Template Service), handling user authentication, and dispatching notifications through RabbitMQ. It leverages Redis for caching frequently accessed data and incorporates circuit breaker patterns for enhanced resilience.

## Features
-   **NestJS Framework**: Provides a robust, scalable, and maintainable application structure.
-   **API Gateway Pattern**: Centralizes access to multiple downstream microservices.
-   **User Authentication**: Implements JWT-based authentication for securing API endpoints.
-   **User Management**: Integrates with a dedicated User Service for user registration, login, and profile updates.
-   **Template Management**: Interacts with a Template Service for creating, retrieving, and managing notification templates.
-   **Notification Dispatch**: Publishes messages to RabbitMQ queues for asynchronous notification processing (email, push).
-   **Caching (Redis)**: Improves performance and reduces load on downstream services using a custom caching decorator and Redis.
-   **Circuit Breaker (Opossum)**: Enhances system resilience by preventing cascading failures to unhealthy microservices.
-   **Request Validation**: Utilizes `class-validator` and `ValidationPipe` for robust input validation.
-   **Swagger API Documentation**: Automatically generates and serves interactive API documentation.
-   **Microservice Communication**: Achieves inter-service communication via HTTP clients and RabbitMQ.

## Getting Started
### Installation
To set up the project locally, follow these steps:

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/emmanueldev247/hng-stage4-task.git
    cd hng-stage4-task
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Build the Project**:
    ```bash
    npm run build
    ```

4.  **Start the Application**:
    ```bash
    npm run start:prod
    ```
    For development with hot-reloading:
    ```bash
    npm run start:dev
    ```

### Environment Variables
The following environment variables are required to run the application. Create a `.env` file in the project root based on `.env.example`.

-   `USER_SERVICE_URL`: The base URL for the User microservice.
    *Example*: `http://localhost:3001`
-   `TEMPLATE_SERVICE_URL`: The base URL for the Template microservice.
    *Example*: `http://localhost:3002`
-   `RABBITMQ_URL`: The connection string for the RabbitMQ server.
    *Example*: `amqp://localhost:5672`
-   `REDIS_URL`: The connection string for the Redis server used for caching.
    *Example*: `redis://localhost:6379`
-   `JWT_SECRET`: A secret key for signing and verifying JWT tokens.
    *Example*: `yourStrongJwtSecretKey`
-   `PORT`: The port on which the API Gateway will listen.
    *Example*: `3000`

## API Documentation
### Base URL
The base URL for all API endpoints (excluding `/health`) is `http://localhost:[PORT]/api/v1`.
The interactive API documentation is available at `http://localhost:[PORT]/api/v1/docs`.

### Endpoints
#### GET /health
**Description**: Checks the operational status of the API Gateway.
**Request**:
No payload.

**Response**:
```json
{
  "status": "OK"
}
```

**Errors**:
-   `500 Internal Server Error`: An unexpected server error occurred.

#### POST /api/v1/register
**Description**: Registers a new user account within the system.
**Request**:
```json
{
  "email": "user@example.com",
  "name": "Test User",
  "push_token": "optionalDevicePushToken",
  "preferences": {
    "email_notifications": true,
    "push_notifications": true
  },
  "password": "StrongPassword123!"
}
```

**Response**:
```json
{
  "access": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  },
  "user": {
    "id": "c3f23a42-9e32-4f02-96a8-b4f1a5a3f6a2",
    "email": "user@example.com",
    "name": "Test User",
    "created_at": "2025-11-12T20:45:31.000Z",
    "updated_at": "2025-11-12T20:45:31.000Z"
  }
}
```

**Errors**:
-   `400 Bad Request`: Invalid input data (e.g., malformed email, weak password, missing required fields).
-   `409 Conflict`: A user with the provided email already exists.

#### POST /api/v1/login
**Description**: Authenticates a user with provided credentials and returns JWT access tokens upon successful login.
**Request**:
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

**Response**:
```json
{
  "access": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  },
  "user": {
    "id": "c3f23a42-9e32-4f02-96a8-b4f1a5a3f6a2",
    "email": "user@example.com",
    "name": "Test User",
    "created_at": "2025-11-12T20:45:31.000Z",
    "updated_at": "2025-11-12T20:45:31.000Z"
  }
}
```

**Errors**:
-   `400 Bad Request`: Invalid input (e.g., missing email or password).
-   `401 Unauthorized`: Invalid credentials provided (incorrect email or password).

#### POST /api/v1/notifications
**Description**: Dispatches a notification to the authenticated user using a specified template and variables.
**Authentication**: Bearer Token required.
**Request**:
```json
{
  "template_code": "welcome_email_v1",
  "variables": {
    "name": "Jane Doe",
    "link": "https://example.com/confirm"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Notification dispatched successfully"
}
```

**Errors**:
-   `400 Bad Request`: Invalid template code, missing required variables for the template, or invalid data in `variables`.
-   `401 Unauthorized`: Missing or invalid authentication token.
-   `503 Service Unavailable`: Downstream services (e.g., User Service, Template Service, RabbitMQ) are currently unreachable.

#### POST /api/v1/templates
**Description**: Creates a new version of a notification template. The system automatically handles versioning based on `template_code`.
**Request**:
```json
{
  "template_code": "new_promotion_email",
  "subject": "Exciting Offer, {{name}}!",
  "body": "Hello {{name}}, check out our new promotion at {{promo_link}}."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "template_code": "new_promotion_email",
    "version": 1,
    "subject": "Exciting Offer, {{name}}!",
    "body": "Hello {{name}}, check out our new promotion at {{promo_link}}.",
    "created_at": "2023-10-27T10:00:00.000Z",
    "updated_at": "2023-10-27T10:00:00.000Z"
  },
  "message": "ok"
}
```

**Errors**:
-   `400 Bad Request`: Missing or invalid fields in the request body.
-   `503 Service Unavailable`: The Template Service is currently unavailable.

#### GET /api/v1/templates
**Description**: Retrieves a paginated list of all template versions, with optional filtering by `template_code`.
**Request Query Parameters**:
-   `template_code` (optional): Filters templates by a specific code.
-   `page` (optional): Specifies the page number for pagination (defaults to 1).
-   `limit` (optional): Defines the number of items per page (defaults to 10).
**Response**:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "template_code": "welcome_email",
      "version": 1,
      "subject": "Welcome, {{name}}!",
      "body": "Hi {{name}}, welcome to our platform. Click {{link}} to get started.",
      "created_at": "2023-01-01T12:00:00.000Z",
      "updated_at": "2023-01-01T12:00:00.000Z"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
      "template_code": "welcome_email",
      "version": 2,
      "subject": "Welcome (v2), {{name}}!",
      "body": "Hi {{name}}, welcome! You can find more info at {{link}}.",
      "created_at": "2023-02-01T12:00:00.000Z",
      "updated_at": "2023-02-01T12:00:00.000Z"
    }
  ],
  "meta": {
    "total": 2,
    "limit": 10,
    "page": 1,
    "total_pages": 1,
    "has_next": false,
    "has_previous": false
  }
}
```

**Errors**:
-   `400 Bad Request`: Invalid query parameters provided.
-   `503 Service Unavailable`: The Template Service is currently unavailable.

#### GET /api/v1/templates/get-by-code
**Description**: Retrieves the latest (highest version) template associated with a specific `template_code`.
**Request Query Parameters**:
-   `template_code` (required): The unique code identifying the template.
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
    "template_code": "welcome_email",
    "version": 2,
    "subject": "Welcome (v2), {{name}}!",
    "body": "Hi {{name}}, welcome! You can find more info at {{link}}.",
    "created_at": "2023-02-01T12:00:00.000Z",
    "updated_at": "2023-02-01T12:00:00.000Z"
  },
  "message": "ok"
}
```

**Errors**:
-   `400 Bad Request`: `template_code` is missing from the query.
-   `404 Not Found`: No template found for the given `template_code`.
-   `503 Service Unavailable`: The Template Service is currently unavailable.

#### GET /api/v1/templates/:id
**Description**: Fetches a single template version by its unique UUID.
**Request Path Parameters**:
-   `id` (required): The UUID of the template to retrieve.
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "b2c3d4e5-f6a7-8901-2345-67890abcdef1",
    "template_code": "welcome_email",
    "version": 2,
    "subject": "Welcome (v2), {{name}}!",
    "body": "Hi {{name}}, welcome! You can find more info at {{link}}.",
    "created_at": "2023-02-01T12:00:00.000Z",
    "updated_at": "2023-02-01T12:00:00.000Z"
  },
  "message": "ok"
}
```

**Errors**:
-   `400 Bad Request`: Invalid UUID format provided for `id`.
-   `404 Not Found`: Template not found for the given `id`.
-   `503 Service Unavailable`: The Template Service is currently unavailable.

#### PATCH /api/v1/templates/:id
**Description**: Applies partial updates to a template identified by its UUID, which results in the creation of a new template version incorporating the changes.
**Request Path Parameters**:
-   `id` (required): The UUID of the template to update.
**Request**:
```json
{
  "subject": "Revised Welcome (v3), {{name}}!",
  "body": "Updated body for {{name}}, check {{link}}."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "c3d4e5f6-a7b8-9012-3456-7890abcdef12",
    "template_code": "welcome_email",
    "version": 3,
    "subject": "Revised Welcome (v3), {{name}}!",
    "body": "Updated body for {{name}}, check {{link}}.",
    "created_at": "2023-03-01T12:00:00.000Z",
    "updated_at": "2023-03-01T12:00:00.000Z"
  },
  "message": "ok"
}
```

**Errors**:
-   `400 Bad Request`: Invalid UUID format for `id` or no valid fields provided for update.
-   `404 Not Found`: Template not found for the given `id`.
-   `503 Service Unavailable`: The Template Service is currently unavailable.

#### DELETE /api/v1/templates/:id
**Description**: Permanently deletes a specific template version identified by its UUID. This action only affects the specified version and does not impact other versions with the same `template_code`.
**Request Path Parameters**:
-   `id` (required): The UUID of the template version to delete.
**Request**:
No payload.

**Response**:
```json
{
  "success": true,
  "message": "Deleted"
}
```

**Errors**:
-   `400 Bad Request`: Invalid UUID format for `id`.
-   `404 Not Found`: Template not found for the given `id`.
-   `503 Service Unavailable`: The Template Service is currently unavailable.

#### GET /api/v1/users/me
**Description**: Retrieves the comprehensive profile details of the currently authenticated user.
**Authentication**: Bearer Token required.
**Request**:
No payload.

**Response**:
```json
{
  "id": "c3f23a42-9e32-4f02-96a8-b4f1a5a3f6a2",
  "email": "user@example.com",
  "name": "Test User",
  "created_at": "2025-11-12T20:45:31.000Z",
  "updated_at": "2025-11-12T20:45:31.000Z"
}
```

**Errors**:
-   `401 Unauthorized`: Missing or invalid authentication token.
-   `503 Service Unavailable`: The User Service is currently unavailable.

#### PATCH /api/v1/users/update
**Description**: Updates specific details of the authenticated user's profile.
**Authentication**: Bearer Token required.
**Request**:
```json
{
  "name": "Updated Name",
  "preferences": {
    "email_notifications": false,
    "push_notifications": true
  }
}
```

**Response**:
```json
{
  "id": "c3f23a42-9e32-4f02-96a8-b4f1a5a3f6a2",
  "email": "user@example.com",
  "name": "Updated Name",
  "created_at": "2025-11-12T20:45:31.000Z",
  "updated_at": "2025-11-12T21:15:42.000Z"
}
```

**Errors**:
-   `400 Bad Request`: Invalid input data provided.
-   `401 Unauthorized`: Missing or invalid authentication token.
-   `503 Service Unavailable`: The User Service is currently unavailable.

#### POST /api/v1/users/devices
**Description**: Registers a new device token for the authenticated user to enable push notifications.
**Authentication**: Bearer Token required.
**Request**:
```json
{
  "device_token": "newDeviceToken123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Device token added successfully"
}
```

**Errors**:
-   `400 Bad Request`: Invalid `device_token` provided.
-   `401 Unauthorized`: Missing or invalid authentication token.
-   `503 Service Unavailable`: The User Service is currently unavailable.

#### DELETE /api/v1/users/devices
**Description**: Removes a specific device token associated with the authenticated user, stopping push notifications to that device.
**Authentication**: Bearer Token required.
**Request**:
```json
{
  "device_token": "existingDeviceToken123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Device token removed successfully"
}
```

**Errors**:
-   `400 Bad Request`: Invalid `device_token` provided.
-   `401 Unauthorized`: Missing or invalid authentication token.
-   `404 Not Found`: The specified device token was not found for the user.
-   `503 Service Unavailable`: The User Service is currently unavailable.

## Technologies Used
-   **Framework**: [NestJS](https://nestjs.com/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Runtime**: [Node.js](https://nodejs.org/)
-   **API Documentation**: [Swagger](https://swagger.io/)
-   **Caching**: [Redis](https://redis.io/) via `@keyv/redis` and `cacheable`
-   **Message Broker**: [RabbitMQ](https://www.rabbitmq.com/) via `@nestjs/microservices`
-   **HTTP Client**: [Axios](https://axios-http.com/) with `axios-retry`
-   **Resilience**: [Opossum](https://github.com/nodesource/opossum) (Circuit Breaker)
-   **Authentication**: [Passport-JWT](https://www.npmjs.com/package/passport-jwt) & [NestJS JWT](https://docs.nestjs.com/security/authentication#jwt-strategy)
-   **Code Quality**: [ESLint](https://eslint.org/) & [Prettier](https://prettier.io/)

## License
This project is currently UNLICENSED as specified in `package.json`.


## Author Info
👋 **Oluwaseyi Oke**

Experienced Software Developer specializing in backend development. Connect with me!

-   **LinkedIn**: [Your LinkedIn Profile](https://linkedin.com/in/oluwaseyi-oke-fullstack-developer)
-   **Portfolio**: [Your Portfolio Website](https://oke-oluwaseyi-portfolio.vercel.app)
-   **Email**: [Your Email Address](mailto:okeoluwaseyimarvellous@gmail.com)

---

[![Maintained by iamArvy](https://img.shields.io/badge/Maintained%20by-iamArvy-blue)](https://github.com/iamArvy)

## Dokugen Badge
[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)