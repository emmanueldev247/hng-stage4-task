# Gateway API

## Overview
The Gateway API is a robust NestJS application built with TypeScript, serving as a central entry point for various microservices. It orchestrates user authentication, manages notification dispatch through RabbitMQ, and leverages Redis for efficient caching, while ensuring resilient communication with downstream services via circuit breakers.

## Features
-   `NestJS`: Provides a modular and scalable architecture for the API gateway.
-   `TypeScript`: Enhances code quality and maintainability through strong typing.
-   `JWT Authentication`: Secures API endpoints, handling user authentication and authorization flows.
-   `RabbitMQ (Microservices)`: Facilitates asynchronous and reliable communication for notification dispatch.
-   `Redis (Cacheable)`: Implements a distributed cache for frequently accessed user and template data, significantly improving response times.
-   `Axios & Axios-Retry`: Manages external HTTP requests to User and Template microservices, incorporating automatic retry logic for transient failures.
-   `Opossum (Circuit Breaker)`: Integrates circuit breaker patterns to enhance system resilience and prevent cascading failures across microservices.
-   `Swagger/OpenAPI`: Automatically generates interactive API documentation for comprehensive endpoint exploration.

## Getting Started
### Installation

To set up the project locally, follow these steps:

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/emmanueldev247/hng-stage4-task.git
    cd gateway
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Build the Project**:
    ```bash
    npm run build
    ```

4.  **Run the Application**:
    -   **Development Mode**: The application will restart on file changes.
        ```bash
        npm run start:dev
        ```
    -   **Production Mode**:
        ```bash
        npm run start:prod
        ```

### Environment Variables
The following environment variables are required to run the application. Create a `.env` file in the project root based on `.env.example`:

-   `USER_SERVICE_URL`: URL for the User microservice (e.g., `http://localhost:3001/api/v1`)
-   `TEMPLATE_SERVICE_URL`: URL for the Template microservice (e.g., `http://localhost:3002/api/v1`)
-   `RABBITMQ_URL`: Connection URL for RabbitMQ (e.g., `amqp://localhost:5672`)
-   `REDIS_URL`: Connection URL for Redis (e.g., `redis://localhost:6379`)
-   `JWT_SECRET`: Secret key for JWT token signing (e.g., `yourSuperSecretJWTKey`)
-   `PORT`: Port on which the API Gateway will listen (e.g., `3000`)

## API Documentation
### Base URL
`http://localhost:3000/api/v1` (adjust port as configured)
Interactive Swagger UI is available at `/api/v1/docs` (e.g., `http://localhost:3000/api/v1/docs`)

### Endpoints

#### `POST /auth/register`
**Description**: Registers a new user account.
**Request**:
```json
{
  "email": "john.doe@example.com",
  "name": "John Doe",
  "push_token": "faketoken123",
  "preferences": {
    "email": true,
    "push": true
  },
  "password": "StrongPassw0rd!"
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
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "device_tokens": [
      "faketoken123"
    ],
    "preferences": {
      "email_notifications": true,
      "push_notifications": true
    }
  }
}
```
**Errors**:
-   `400 Bad Request`: Invalid input or missing fields.
-   `409 Conflict`: User with provided email already exists.

#### `POST /auth/login`
**Description**: Authenticates a user and returns an access token.
**Request**:
```json
{
  "email": "john.doe@example.com",
  "password": "StrongPassw0rd!"
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
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "device_tokens": [
      "faketoken123"
    ],
    "preferences": {
      "email_notifications": true,
      "push_notifications": true
    }
  }
}
```
**Errors**:
-   `400 Bad Request`: Invalid input or missing fields.
-   `401 Unauthorized`: Invalid credentials.

#### `POST /notifications`
**Description**: Dispatches a notification to the authenticated user based on a template.
**Authentication**: Bearer Token
**Request**:
```json
{
  "template_code": "welcome_email_v1",
  "variables": {
    "name": "John Doe",
    "link": "https://example.com/verify"
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
-   `400 Bad Request`: Missing template code, invalid variables, or required template variables not provided.
-   `401 Unauthorized`: Invalid or missing authentication token.
-   `500 Internal Server Error`: An unexpected server error occurred.

#### `POST /templates`
**Description**: Creates a new version of a notification template.
**Request**:
```json
{
  "template_code": "welcome_email",
  "subject": "Welcome, {{name}}!",
  "body": "Hi {{name}}, visit {{link}}"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "template_code": "welcome_email",
    "version": 1,
    "subject": "Welcome, {{name}}!",
    "body": "Hi {{name}}, visit {{link}}",
    "created_at": "2023-10-26T10:00:00.000Z",
    "updated_at": "2023-10-26T10:00:00.000Z"
  },
  "message": "Template version created"
}
```
**Errors**:
-   `400 Bad Request`: Missing or invalid fields.

#### `GET /templates`
**Description**: Retrieves a paginated list of all template versions, with optional filtering by `template_code`.
**Request**:
```
GET /api/v1/templates?template_code=welcome_email&page=1&limit=10
```
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "template_code": "welcome_email",
      "version": 1,
      "subject": "Welcome, {{name}}!",
      "body": "Hi {{name}}, visit {{link}}",
      "created_at": "2023-10-26T10:00:00.000Z",
      "updated_at": "2023-10-26T10:00:00.000Z"
    }
  ],
  "message": "List returned successfully",
  "meta": {
    "total": 1,
    "limit": 10,
    "page": 1,
    "total_pages": 1,
    "has_next": false,
    "has_previous": false
  }
}
```
**Errors**:
-   `503 Service Unavailable`: Template service currently unavailable.

#### `GET /templates/get-by-code`
**Description**: Retrieves the latest version of a template by its `template_code`.
**Request**:
```
GET /api/v1/templates/get-by-code?template_code=welcome_email
```
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "template_code": "welcome_email",
    "version": 1,
    "subject": "Welcome, {{name}}!",
    "body": "Hi {{name}}, visit {{link}}",
    "created_at": "2023-10-26T10:00:00.000Z",
    "updated_at": "2023-10-26T10:00:00.000Z"
  },
  "message": "ok"
}
```
**Errors**:
-   `400 Bad Request`: `template_code` is missing or invalid.
-   `404 Not Found`: Template with the specified code not found.

#### `GET /templates/:id`
**Description**: Retrieves a specific template version by its UUID.
**Request**:
```
GET /api/v1/templates/a1b2c3d4-e5f6-7890-1234-567890abcdef
```
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "template_code": "welcome_email",
    "version": 1,
    "subject": "Welcome, {{name}}!",
    "body": "Hi {{name}}, visit {{link}}",
    "created_at": "2023-10-26T10:00:00.000Z",
    "updated_at": "2023-10-26T10:00:00.000Z"
  },
  "message": "ok"
}
```
**Errors**:
-   `400 Bad Request`: Invalid UUID format.
-   `404 Not Found`: Template with the specified ID not found.

#### `PATCH /templates/:id`
**Description**: Updates an existing template, creating a new version with the changes.
**Request**:
```json
{
  "subject": "Updated Welcome Subject, {{name}}!",
  "body": "Hello {{name}}, here is your new updated link: {{link}}"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "template_code": "welcome_email",
    "version": 2,
    "subject": "Updated Welcome Subject, {{name}}!",
    "body": "Hello {{name}}, here is your new updated link: {{link}}",
    "created_at": "2023-10-26T10:00:00.000Z",
    "updated_at": "2023-10-26T10:00:00.000Z"
  },
  "message": "New version created"
}
```
**Errors**:
-   `400 Bad Request`: No fields to update provided or invalid data.
-   `404 Not Found`: Template with the specified ID not found.

#### `DELETE /templates/:id`
**Description**: Hard deletes a specific template version by its UUID.
**Request**:
```
DELETE /api/v1/templates/a1b2c3d4-e5f6-7890-1234-567890abcdef
```
**Response**:
`204 No Content`
**Errors**:
-   `400 Bad Request`: Invalid UUID format.
-   `404 Not Found`: Template with the specified ID not found.

#### `PATCH /users/update`
**Description**: Updates details for the authenticated user.
**Authentication**: Bearer Token
**Request**:
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "preferences": {
    "email": false,
    "push": true
  }
}
```
**Response**:
```json
{
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "email": "jane.doe@example.com",
  "name": "Jane Doe",
  "device_tokens": [
    "faketoken123"
  ],
  "preferences": {
    "email_notifications": false,
    "push_notifications": true
  }
}
```
**Errors**:
-   `400 Bad Request`: Invalid input or missing fields.
-   `401 Unauthorized`: Invalid or missing authentication token.

#### `POST /users/device_tokens`
**Description**: Adds a new device token for the authenticated user to receive push notifications.
**Authentication**: Bearer Token
**Request**:
```json
{
  "token": "newfaketoken456"
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
-   `400 Bad Request`: Invalid or missing token.
-   `401 Unauthorized`: Invalid or missing authentication token.

#### `DELETE /users/device_tokens/:token`
**Description**: Removes a device token for the authenticated user.
**Authentication**: Bearer Token
**Request**:
```
DELETE /api/v1/users/device_tokens/faketoken123
```
**Response**:
```json
{
  "success": true,
  "message": "Device token removed successfully"
}
```
**Errors**:
-   `401 Unauthorized`: Invalid or missing authentication token.
-   `404 Not Found`: Device token not found for the user.

## Usage
The Gateway API acts as a facade, streamlining interactions with backend services. Authenticated users can securely manage their profiles and preferences, while also dispatching templated notifications. Administrative operations for template management are also routed through this gateway.

Example: Authenticating a user and then sending a notification.

1.  **Register a User**:
    ```bash
    curl -X POST \
      http://localhost:3000/api/v1/auth/register \
      -H 'Content-Type: application/json' \
      -d '{
            "email": "test@example.com",
            "name": "Test User",
            "preferences": { "email": true, "push": true },
            "password": "StrongPassword123!"
          }'
    ```
    This will return `access.token` and `user.id`.

2.  **Send a Notification**:
    Use the `access.token` obtained from registration/login in the Authorization header.
    ```bash
    curl -X POST \
      http://localhost:3000/api/v1/notifications \
      -H 'Content-Type: application/json' \
      -H 'Authorization: Bearer <your_jwt_token>' \
      -d '{
            "template_code": "welcome_email_v1",
            "variables": { "name": "Test User", "link": "https://example.com/start" }
          }'
    ```
    Replace `<your_jwt_token>` with the actual token.

## Technologies Used

| Technology         | Description                                                                                             | Link                                                                      |
| :----------------- | :------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------ |
| **NestJS**         | Progressive Node.js framework for building efficient, reliable and scalable server-side applications.   | [NestJS](https://nestjs.com/)                                             |
| **TypeScript**     | Superset of JavaScript that adds optional static typing to the language.                                | [TypeScript](https://www.typescriptlang.org/)                             |
| **Redis**          | In-memory data structure store, used as a cache for improved performance.                               | [Redis](https://redis.io/)                                                |
| **RabbitMQ**       | Open-source message broker that implements the Advanced Message Queuing Protocol (AMQP).                | [RabbitMQ](https://www.rabbitmq.com/)                                     |
| **JSON Web Tokens**| Standard for creating access tokens that assert claims to be transferred between two parties.           | [JWT](https://jwt.io/)                                                    |
| **Opossum**        | Node.js circuit breaker library for robust service-to-service communication.                            | [Opossum](https://github.com/nodeshift/opossum)                           |
| **Axios**          | Promise-based HTTP client for the browser and Node.js.                                                  | [Axios](https://axios-http.com/)                                          |
| **Swagger/OpenAPI**| Tooling for designing, building, documenting, and consuming REST APIs.                                  | [Swagger](https://swagger.io/docs/specification/about-api-specification/) |
| **ESLint**         | Pluggable linting utility for JavaScript and TypeScript.                                                | [ESLint](https://eslint.org/)                                             |
| **Prettier**       | Opinionated code formatter.                                                                             | [Prettier](https://prettier.io/)                                          |

## License
This project is currently UNLICENSED. Refer to the `package.json` file for more details.

## Author Info

<<<<<<< HEAD
👋 **Oluwaseyi Oke**

Experienced Software Developer specializing in backend development. Connect with me!

-   **LinkedIn**: [Your LinkedIn Profile](https://linkedin.com/in/oluwaseyi-oke-fullstack-developer)
-   **Portfolio**: [Your Portfolio Website](https://oke-oluwaseyi-portfolio.vercel.app)
-   **Email**: [Your Email Address](mailto:okeoluwaseyimarvellous@gmail.com)

---

[![Maintained by iamArvy](https://img.shields.io/badge/Maintained%20by-iamArvy-blue)](https://github.com/iamArvy)
=======
👋 **Emmanuel Okwudili**

Experienced Software Engineer specializing in backend development. Connect with me!

-   **LinkedIn**: [Your LinkedIn Profile](https://linkedin.com/in/emmanuelokwudili)
-   **Portfolio**: [Your Portfolio Website](https://your-portfolio.com)
-   **Email**: [Your Email Address](mailto:youremail@example.com)

---

[![Maintained by Emmanuel](https://img.shields.io/badge/Maintained%20by-Emmanuel-blue)](https://github.com/emmanueldev247)
>>>>>>> 5b9535c (feat(gateway:template): create Template module and restructure DTOs)
[![Made with NestJS](https://img.shields.io/badge/Made%20with-NestJS-red)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Runtime-Node.js-green?logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-UNLICENSED-red)](https://choosealicense.com/licenses/unlicense/)

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)