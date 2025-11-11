# Template Service (Notifications Monorepo)

The **Template Service** is one of the microservices in the Distributed Notification System. It owns **notification templates** (subject + body), handles **auto‑versioning per `template_code`**, and exposes a clean REST API for CRUD and retrieval. Other services (Gateway, Email, Push) call this service to fetch the **latest template** for a given code and render it with variables (e.g., `{{name}}`, `{{link}}`).

- **Language/Framework:** Node.js (NestJS), TypeScript
- **Database:** PostgreSQL (`templates_db`)
- **ORM:** TypeORM
- **Docs:** Swagger at `/docs`
- **Health:** `/health` (service + DB check)
- **Port (default):** `3002`
- **Admin Auth:** API Key required via `x-api-key` for mutating endpoints (**POST**, **PATCH**, **DELETE**).

---

## Responsibilities

- **Authoritative store** for templates
  - Create new template versions (**auto-versioning**).
  - Retrieve latest by `template_code`.
  - Retrieve any version by `id` (UUID).
  - List templates (paginated), filterable by `template_code`.
  - Delete a **single** version by `id`.
- **Response envelope** (used across the platform):

```json
{
  "success": true,
  "data": [],
  "message": "ok",
  "meta": {
    "total": 0,
    "limit": 20,
    "page": 1,
    "total_pages": 1,
    "has_next": false,
    "has_previous": false
  }
}
```

Errors follow the same shape with `success: false` and an `error` code.

---

## Data Model

### Entity (TypeORM)

```ts
@Entity({ name: 'templates' })
@Unique('uq_templates_code_version', ['template_code', 'version'])
export class TemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_templates_code')
  @Column({ type: 'text' })
  template_code!: string;

  @Column({ type: 'int', default: 1 })
  version!: number;

  @Column({ type: 'text' })
  subject!: string;

  @Column({ type: 'text' })
  body!: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at!: Date;
}
```

### ASCII View

```
templates
├─ id (uuid, PK)
├─ template_code (text, indexed)
├─ version (int)         ← unique together with template_code
├─ subject (text)
├─ body (text)
├─ created_at (timestamptz)
└─ updated_at (timestamptz)

UNIQUE: (template_code, version)
INDEX : template_code
```

**Versioning rules**

- First row for a `template_code` → `version = 1`.
- Every mutation (**PATCH**) creates a **new row** with `version = latest + 1`.
- Deleting a row only affects that specific `id`/version.

---

## API

**Base URL (service):** `http://localhost:3002`

| Method   | Path                                                        | Auth          | Description                      |
| -------- | ----------------------------------------------------------- | ------------- | -------------------------------- |
| `GET`    | `/health`                                                   | none          | Service & DB status              |
| `GET`    | `/api/v1/templates?template_code=CODE`                      | none          | Latest version for a code        |
| `GET`    | `/api/v1/templates/:id`                                     | none          | Fetch a specific version by UUID |
| `GET`    | `/api/v1/templates/list?template_code=CODE&page=1&limit=20` | none          | Paginated list                   |
| `POST`   | `/api/v1/templates`                                         | **x-api-key** | Create (auto-versioned)          |
| `PATCH`  | `/api/v1/templates/:id`                                     | **x-api-key** | Patch (creates new version)      |
| `DELETE` | `/api/v1/templates/:id`                                     | **x-api-key** | Delete **single** version        |

### Swagger

- **URL:** `GET /docs`
- DTOs are decorated with `@nestjs/swagger` and include examples.
- Admin endpoints are annotated to show required header: `x-api-key`.

---

## Admin Authentication (API Key)

Mutating endpoints require an API key header:

```
x-api-key: <YOUR_ADMIN_API_KEY>
```

- Implemented via a Nest guard (`ApiKeyGuard`) applied to **POST**, **PATCH**, and **DELETE**.
- Typical configuration: set `TEMPLATE_ADMIN_API_KEY` as an environment variable and validate against it in the guard.

> Any request missing or with an invalid `x-api-key` receives `401/403` depending on your guard implementation.

---

## Examples (cURL)

### Health

```bash
curl -s http://localhost:3002/health | jq
```

### Create (auto-version) — **Admin**

```bash
curl -s -X POST http://localhost:3002/api/v1/templates \
  -H "Content-Type: application/json" \
  -H "x-api-key: $TEMPLATE_ADMIN_API_KEY" \
  -d '{
    "template_code": "welcome_email",
    "subject": "Welcome, {{name}}!",
    "body": "Hi {{name}}, visit {{link}}"
  }' | jq
```

### Get latest by code

```bash
curl -s "http://localhost:3002/api/v1/templates?template_code=welcome_email" | jq
```

### Get by id

```bash
curl -s http://localhost:3002/api/v1/templates/<TEMPLATE_ID> | jq
```

### Patch (creates new version) — **Admin**

```bash
curl -s -X PATCH http://localhost:3002/api/v1/templates/<TEMPLATE_ID> \
  -H "Content-Type: application/json" \
  -H "x-api-key: $TEMPLATE_ADMIN_API_KEY" \
  -d '{ "subject": "Welcome (patched), {{name}}!" }' | jq
```

### List (paginated)

```bash
curl -s "http://localhost:3002/api/v1/templates/list?template_code=welcome_email&page=1&limit=20" | jq
```

### Delete single version — **Admin**

```bash
curl -i -s -X DELETE http://localhost:3002/api/v1/templates/<TEMPLATE_ID> \
  -H "x-api-key: $TEMPLATE_ADMIN_API_KEY"
# 204 No Content
```

---

## Environment Variables

| Variable                     | Default              | Purpose                                    |
| ---------------------------- | -------------------- | ------------------------------------------ |
| `PORT`                       | `3002`               | HTTP port                                  |
| `TEMPLATE_DB_HOST`           | `localhost`          | DB host                                    |
| `TEMPLATE_DB_PORT`           | `5432`               | DB port                                    |
| `TEMPLATE_DB_USER`           | `templates_dev`      | App DB user                                |
| `TEMPLATE_DB_PASSWORD`       | `templates_dev_pass` | App DB password                            |
| `TEMPLATE_DB_NAME`           | `templates_db`       | App database name                          |
| `TYPEORM_SYNCHRONIZE`        | `true`               | Auto sync schema in dev                    |
| `TYPEORM_LOGGING`            | `false`              | SQL logging                                |
| `TEMPLATE_DB_ADMIN_USER`     | `postgres`           | **Bootstrap** admin user                   |
| `TEMPLATE_DB_ADMIN_PASSWORD` | _(empty)_            | **Bootstrap** admin password               |
| `TEMPLATE_DB_ADMIN_DB`       | `postgres`           | **Bootstrap** admin DB                     |
| `TEMPLATE_ADMIN_API_KEY`     | _(none)_             | **Admin API key** checked by `ApiKeyGuard` |

### `.env.example`

```
PORT=3002

TEMPLATE_DB_HOST=localhost
TEMPLATE_DB_PORT=5432
TEMPLATE_DB_USER=templates_dev
TEMPLATE_DB_PASSWORD=templates_dev_pass
TEMPLATE_DB_NAME=templates_db

TYPEORM_SYNCHRONIZE=true
TYPEORM_LOGGING=false

# admin creds for bootstrap (local/dev only)
TEMPLATE_DB_ADMIN_USER=postgres
TEMPLATE_DB_ADMIN_PASSWORD=
TEMPLATE_DB_ADMIN_DB=postgres

# Admin API key for mutating endpoints
TEMPLATE_ADMIN_API_KEY=change-me
```

> In production: set `TYPEORM_SYNCHRONIZE=false`, manage schema via migrations, and **do not** bundle admin DB credentials with the app. Mount secrets using your platform’s secret manager.

---

## Running Locally

### With pnpm (workspace root)

```bash
pnpm install

# run only the template service in dev mode (watch)
pnpm --filter template start:dev
# or inside /template
pnpm start:dev
```

Ensure PostgreSQL is running and reachable with the env vars above.

### With Docker Compose (Postgres)

Add to your root `docker-compose.yml` as needed:

```yaml
services:
  postgres:
    image: postgres:16
    container_name: notif_pg
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - '5432:5432'
    volumes:
      - notif_pg:/var/lib/postgresql/data
volumes:
  notif_pg:
```

Start:

```bash
docker compose up -d postgres
```

Then start the service with appropriate `.env`.

---

## DB Bootstrap

On startup, the service tries to connect to `templates_db` with app creds. If the DB is missing (error `3D000`), it temporarily connects using **admin** env vars to:

1. Create the database if needed,
2. Set owner to the app user,
3. Ensure extensions `uuid-ossp` and `pgcrypto` exist.

> This bootstrap is for **local/dev** convenience. For prod/staging, provision DBs externally and remove admin envs from the app container.

---

## Health Endpoint

`GET /health` returns JSON like:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2025-11-11T14:59:30.123Z",
    "service": "template",
    "checks": { "db": "up" }
  },
  "message": "Service is healthy"
}
```

If DB is unreachable, status becomes `"degraded"` with message `"Database unreachable"` (still HTTP 200 in this design—tune for your SLOs).

---

## Security & Conventions

- **Snake_case** for request/response fields.
- **Validation** via `class-validator` + Nest `ValidationPipe` (whitelist on).
- **Admin endpoints** protected by `ApiKeyGuard` (`x-api-key` header).
- **No credentials in code**; use environment variables or a secret manager.
- **Idempotency** for creation should be handled at the Gateway if required.

---

## Performance Notes

- `template_code` index → fast latest-version lookup (`ORDER BY version DESC LIMIT 1`).
- Insert-only versioning keeps history immutable; delete only affects the specific `id` row.
- Disable ORM logs in production (`TYPEORM_LOGGING=false`).

---

## Testing

```bash
pnpm --filter template test
pnpm --filter template test:e2e
```

Add unit tests for versioning logic and end-to-end tests against an ephemeral Postgres (e.g., Testcontainers).

---

## Operational Playbook

- **Create new version:** `POST /api/v1/templates` (Admin)
- **Patch/clone new version:** `PATCH /api/v1/templates/:id` (Admin)
- **Delete a bad version:** `DELETE /api/v1/templates/:id` (Admin)
- **Read latest:** `GET /api/v1/templates?template_code=...`
- **List history:** `GET /api/v1/templates/list?template_code=...`

**Rollback tip:** Re-publish an older subject/body as a fresh version (higher `version` wins for “latest”).

---

## License

Internal educational project for HNG Stage 4 (distributed systems).
