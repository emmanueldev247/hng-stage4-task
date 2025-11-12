# 📦 User Service (HNG Stage 4)

This service is one component of the distributed notification system. Its sole responsibility is to manage all user-related data, including profiles, credentials, preferences, and device tokens.

It is a [NestJS](https://nestjs.com/) application that connects to its own dedicated PostgreSQL database.

---

## 🚀 Getting Started

This service **cannot** run standalone. It **must** be run using the master `docker-compose.yml` file at the root of the monorepo.

1.  **Start the Infrastructure:**
    From the **monorepo root** (`hng-stage4/`), run the Docker infrastructure. This starts the PostgreSQL database, RabbitMQ, and Redis.
    ```bash
    docker compose up
    ```

2.  **Install Dependencies:**
    In a **new terminal**, navigate to this service's directory and install dependencies using `pnpm`.
    ```bash
    cd user-service
    pnpm install
    ```

3.  **Run the Service:**
    Once the dependencies are installed, run the service in development mode.
    ```bash
    pnpm run start:dev
    ```
    The service will start on `http://localhost:3000`.

---

## 🔧 Environment Variables

This service requires the following environment variables to be set in a `.env` file inside the `user-service/` directory. These values **must match** the ones defined in the master `docker-compose.yml` and root `.env` file.

* `DB_HOST`: The hostname of the database (e.g., `localhost`)
* `DB_PORT`: The port for the database (e.g., `5432`)
* `DB_DATABASE`: The name of the database (e.g., `user_db`)
* `DB_USERNAME`: The username for the database (e.g., `users_dev`)
* `DB_PASSWORD`: The password for the database
* `JWT_SECRET`: A long, random string used for signing tokens (not currently used, but planned)

---

## 📖 API Endpoints

All responses are wrapped in a standard success object: `{ "success": true, "message": "...", "data": {...} }`.

### User Management

#### 1. Create User
* **Route:** `POST /users/`
* **Description:** Creates a new user.
* **Request Body:**
    ```json
    {
      "name": "Test User",
      "email": "test@example.com",
      "password": "mypassword123",
      "preferences": {
        "email_notifications": true,
        "push_notifications": true
      },
      "push_token": "optional-first-token"
    }
    ```
* **Success Response (`201`):** User object.

#### 2. Validate User Password
* **Route:** `POST /users/validate-password`
* **Description:** Checks if an email and password are correct. Used by other services for login.
* **Request Body:**
    ```json
    {
      "email": "test@example.com",
      "password": "mypassword123"
    }
    ```
* **Success Response (`200`):** Basic user object (without password).
* **Error Response (`401`):** If credentials are invalid.

#### 3. Update User
* **Route:** `PATCH /users/:id`
* **Description:** Updates a user's details.
* **Request Body:**
    ```json
    {
      "name": "New Name",
      "preferences": {
        "email_notifications": false
      }
    }
    ```
* **Success Response (`200`):** The updated user object.

#### 4. Delete User
* **Route:** `DELETE /users/:id`
* **Description:** Deletes a user and all their related data (devices, preferences).
* **Success Response (`200`):**
    ```json
    {
      "success": true,
      "message": "User with id ... successfully deleted"
    }
    ```

### Contact & Device Management

#### 1. Get User Contact Info
* **Route:** `GET /users/:id/contact`
* **Description:** The primary endpoint for other services to get a user's contact details and preferences.
* **Success Response (`200`):**
    ```json
    {
      "success": true,
      "message": "User contact info retrieved",
      "data": {
        "user_id": "...",
        "name": "Test User",
        "email": "test@example.com",
        "device_tokens": [ "token-a", "token-b" ],
        "preferences": {
          "email_notifications": true,
          "push_notifications": true
        }
      }
    }
    ```

#### 2. Add Device Token
* **Route:** `POST /users/:id/devices`
* **Description:** Adds a new, unique device token for a user (for push notifications).
* **Request Body:**
    ```json
    {
      "device_token": "a-brand-new-token",
      "device_type": "android"
    }
    ```
* **Success Response (`200`):** The new device object.

#### 3. Remove Device Token
* **Route:** `DELETE /users/devices`
* **Description:** Removes a device token (e.g., on user logout).
* **Request Body:**
    ```json
    {
      "device_token": "the-token-to-remove"
    }
    ```
* **Success Response (`200`):**
    ```json
    {
      "success": true,
      "message": "Device token removed"
    }
    ```