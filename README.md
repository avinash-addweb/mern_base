# Base MERN Monorepo

A production-ready monorepo with **Express API**, **Next.js frontend**, and **React admin panel** — all in TypeScript.

## Tech Stack

| Layer          | Technology                                                                  |
| -------------- | --------------------------------------------------------------------------- |
| API            | Express 5, Prisma (PostgreSQL/MySQL), Mongoose (MongoDB), JWT Auth, Swagger |
| Frontend       | Next.js 15 (App Router, SSR), Tailwind CSS v4, shadcn/ui                    |
| Admin          | React 19, Vite 6, React Router 7, Tailwind CSS v4, shadcn/ui                |
| Shared         | TypeScript, npm workspaces, ESLint 9, Prettier                              |
| Infrastructure | Docker, docker-compose, Redis, Elasticsearch, Seq                           |
| CI/CD          | GitHub Actions (lint, type-check, test, build)                              |

## Features

| Category | Feature              | Description                                                            |
| -------- | -------------------- | ---------------------------------------------------------------------- |
| Auth     | JWT + Refresh Tokens | Access/refresh token rotation, secure token storage                    |
| Auth     | Password Reset       | Email-based reset flow with crypto tokens                              |
| Auth     | RBAC                 | Role-based access control (`authorize(...roles)` middleware)           |
| Data     | User CRUD            | Full admin user management (list, update, delete, role change)         |
| Data     | File Upload          | Single/multiple file upload with Multer (disk storage, type filtering) |
| Data     | Audit Logging        | MongoDB-backed action audit trail (who did what, when)                 |
| Data     | Pagination           | Generic Prisma pagination helper with sort support                     |
| Search   | Elasticsearch        | Full-text search with auto-sync on user CRUD                           |
| Caching  | Redis Cache          | Programmatic cache service + automatic GET response cache middleware   |
| Email    | Nodemailer           | SMTP transport with Ethereal fallback in dev                           |
| API      | Versioning           | v1/v2 route structure with override pattern                            |
| DB       | Multi-Provider       | PostgreSQL (default) or MySQL via build-time schema selection          |
| DB       | Seed Script          | Idempotent admin + sample user seeding                                 |
| Testing  | Jest Examples        | API (supertest), Web (RTL), Admin (RTL) test suites                    |
| CI/CD    | GitHub Actions       | Lint, type-check, test (with service containers), build                |

## Folder Structure

```
base_mern/
├── apps/
│   ├── api/              # Express API (:4100)
│   │   ├── src/
│   │   │   ├── config/          # env, prisma, db, redis, elasticsearch, logger, swagger
│   │   │   ├── middlewares/     # auth, authorize, validate, cache, audit, rateLimiter, errorHandler
│   │   │   ├── modules/
│   │   │   │   ├── auth/        # Login, register, forgot/reset password, refresh/logout
│   │   │   │   ├── users/       # Admin user CRUD (list, update, delete, role change)
│   │   │   │   ├── uploads/     # File upload (single, multiple, delete)
│   │   │   │   ├── audit/       # Audit log (MongoDB) with admin query endpoint
│   │   │   │   ├── search/      # Elasticsearch full-text search
│   │   │   │   └── health/      # Health check
│   │   │   ├── routes/
│   │   │   │   ├── v1/          # API v1 routes
│   │   │   │   └── v2/          # API v2 routes (extends v1)
│   │   │   ├── services/        # cache, email, elasticsearch helpers
│   │   │   ├── utils/           # paginate helper
│   │   │   └── prisma/          # schema, migrations, seed
│   │   ├── scripts/             # select-schema.js (multi-DB support)
│   │   └── uploads/             # Uploaded files directory
│   ├── web/              # Next.js frontend (:4200)
│   └── admin/            # Vite React admin (:4300)
├── packages/
│   ├── config/           # Shared ESLint, Prettier, Jest configs
│   ├── types/            # Shared TypeScript interfaces, Zod schemas, enums
│   └── utils/            # Shared utility functions + API client with refresh support
├── .github/workflows/    # CI/CD pipelines
├── docker-compose.yml    # Dev environment
├── docker-compose.prod.yml
├── tsconfig.base.json
└── package.json          # Workspace root
```

## Prerequisites

- **Node.js** v24.14.0 (see `.nvmrc`)
- **npm** v11.9.0+
- **PostgreSQL** 16+ (or use Docker)
- **MongoDB** 7+ (or use Docker)
- **Redis** 7+ (or use Docker)
- **Docker** & **Docker Compose** (recommended for all services)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy the example env file for the API:

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env` with your credentials:

```env
NODE_ENV=development
PORT=4100
DATABASE_URL="postgresql://postgres:postgres@localhost:54320/base_mern?schema=public"
DATABASE_PROVIDER=postgresql
MONGODB_URI="mongodb://localhost:27018/base_mern"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
REDIS_URL="redis://localhost:6380"
ELASTICSEARCH_URL="http://localhost:9201"
```

For the frontend apps (optional):

```bash
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env
```

### 3. Start Infrastructure Services

```bash
docker compose up -d
```

This starts PostgreSQL, MongoDB, Redis, Elasticsearch, MySQL (optional), and Seq.

### 4. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed default users (admin@base-mern.dev / admin123 + 5 sample users)
npm run db:seed
```

### 5. Start Development

```bash
# Start all 3 apps concurrently
npm run dev

# Or start individually
npm run dev:api    # API on http://localhost:4100
npm run dev:web    # Frontend on http://localhost:4200
npm run dev:admin  # Admin on http://localhost:4300
```

### 6. Using Docker (Alternative)

```bash
docker compose up          # Dev with hot-reload
docker compose -f docker-compose.prod.yml up --build   # Production builds
```

## Available Scripts

| Command                | Description                                  |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Start all 3 apps concurrently                |
| `npm run dev:api`      | Start API only (nodemon + tsx)               |
| `npm run dev:web`      | Start Next.js dev server only                |
| `npm run dev:admin`    | Start Vite dev server only                   |
| `npm run build`        | Build all apps for production                |
| `npm run lint`         | Run ESLint across all workspaces             |
| `npm run type-check`   | Run `tsc --noEmit` on all apps               |
| `npm run format`       | Format all files with Prettier               |
| `npm run format:check` | Check formatting without writing             |
| `npm run test`         | Run Jest tests across all workspaces         |
| `npm run test:api`     | Run API tests only                           |
| `npm run test:web`     | Run frontend tests only                      |
| `npm run test:admin`   | Run admin tests only                         |
| `npm run db:generate`  | Generate Prisma client                       |
| `npm run db:migrate`   | Run Prisma migrations                        |
| `npm run db:seed`      | Seed admin + sample users                    |
| `npm run db:setup`     | Select DB provider schema (postgresql/mysql) |
| `npm run db:studio`    | Open Prisma Studio (PostgreSQL GUI)          |

## API Documentation

Swagger UI is available at **http://localhost:4100/api-docs** when the API is running.

### API Endpoints

#### Auth

| Method | Endpoint                       | Description                             | Auth         |
| ------ | ------------------------------ | --------------------------------------- | ------------ |
| `POST` | `/api/v1/auth/register`        | Register a new user                     | No           |
| `POST` | `/api/v1/auth/login`           | Login (returns access + refresh tokens) | No           |
| `GET`  | `/api/v1/auth/me`              | Get current user                        | Bearer Token |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset email            | No           |
| `POST` | `/api/v1/auth/reset-password`  | Reset password with token               | No           |
| `POST` | `/api/v1/auth/refresh`         | Rotate refresh token                    | No           |
| `POST` | `/api/v1/auth/logout`          | Revoke refresh token                    | No           |

#### Users (Admin Only)

| Method   | Endpoint                 | Description                        | Auth  |
| -------- | ------------------------ | ---------------------------------- | ----- |
| `GET`    | `/api/v1/users`          | List users (paginated)             | Admin |
| `GET`    | `/api/v1/users/:id`      | Get user by ID                     | Admin |
| `PUT`    | `/api/v1/users/:id`      | Update user                        | Admin |
| `DELETE` | `/api/v1/users/:id`      | Delete user (prevents self-delete) | Admin |
| `PATCH`  | `/api/v1/users/:id/role` | Change user role                   | Admin |

#### File Uploads

| Method   | Endpoint                   | Description                    | Auth         |
| -------- | -------------------------- | ------------------------------ | ------------ |
| `POST`   | `/api/v1/uploads`          | Upload single file             | Bearer Token |
| `POST`   | `/api/v1/uploads/multiple` | Upload multiple files (max 10) | Bearer Token |
| `GET`    | `/api/v1/uploads/:id`      | Get upload metadata            | Bearer Token |
| `DELETE` | `/api/v1/uploads/:id`      | Delete upload                  | Admin        |

#### Audit Logs (Admin Only)

| Method | Endpoint             | Description                                                         | Auth  |
| ------ | -------------------- | ------------------------------------------------------------------- | ----- |
| `GET`  | `/api/v1/audit-logs` | Query audit logs (filterable by action, resource, user, date range) | Admin |

#### Search

| Method | Endpoint                            | Description                        | Auth         |
| ------ | ----------------------------------- | ---------------------------------- | ------------ |
| `GET`  | `/api/v1/search?q=term&index=users` | Full-text search via Elasticsearch | Bearer Token |

#### System

| Method | Endpoint         | Description                         | Auth |
| ------ | ---------------- | ----------------------------------- | ---- |
| `GET`  | `/api/v1/health` | Health check (all service statuses) | No   |

### Example Requests

```bash
# Register
curl -X POST http://localhost:4100/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "name": "John Doe", "password": "password123"}'

# Login (returns accessToken + refreshToken)
curl -X POST http://localhost:4100/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Protected request
curl http://localhost:4100/api/v1/auth/me \
  -H "Authorization: Bearer <accessToken>"

# Refresh tokens
curl -X POST http://localhost:4100/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<refreshToken>"}'

# Upload a file
curl -X POST http://localhost:4100/api/v1/uploads \
  -H "Authorization: Bearer <accessToken>" \
  -F "file=@photo.jpg"

# Search users
curl "http://localhost:4100/api/v1/search?q=john&index=users" \
  -H "Authorization: Bearer <accessToken>"
```

## Database Strategy

| Database          | Use Case                   | ORM                    | Data                           |
| ----------------- | -------------------------- | ---------------------- | ------------------------------ |
| **PostgreSQL**    | Relational/structured data | Prisma                 | Users, uploads, refresh tokens |
| **MongoDB**       | Flexible/document data     | Mongoose               | Audit logs, analytics          |
| **Redis**         | Caching, rate limiting     | ioredis                | Response cache, session data   |
| **Elasticsearch** | Full-text search           | @elastic/elasticsearch | User search index              |

### Multi-Database Provider Support

The skeleton supports both PostgreSQL (default) and MySQL via build-time schema selection:

```bash
# Switch to MySQL
# 1. Set in .env:
DATABASE_PROVIDER=mysql
DATABASE_URL=mysql://root:root@localhost:33060/base_mern

# 2. Run schema setup + migration
npm run db:setup
npm run db:migrate
```

Schema files: `schema.postgresql.prisma` and `schema.mysql.prisma` in `apps/api/src/prisma/`.

### Prisma Models

- **User** — id, email, name, password, role (USER/ADMIN), resetToken, resetTokenExp
- **Upload** — id, filename, originalName, mimetype, size, path, uploadedBy (FK to User)
- **RefreshToken** — id, token (unique), userId (FK to User), expiresAt, revoked

### Seed Data

```bash
npm run db:seed
```

Seeds (idempotent via upsert):

- Admin: `admin@base-mern.dev` / `admin123`
- 5 sample users with USER role

## Authentication

- **JWT access + refresh token** rotation pattern
- Access token: 15min expiry (configurable via `JWT_ACCESS_EXPIRES_IN`)
- Refresh token: 7 day expiry, stored as SHA-256 hash in DB, rotated on every refresh
- Passwords hashed with **bcrypt** (12 salt rounds)
- Password reset via crypto token (SHA-256 hashed in DB, 1-hour expiry)
- RBAC middleware: `authorize(UserRole.ADMIN)` — checks role after auth
- Rate limiting on auth endpoints (10 req/15min)

## Caching

### Redis Cache Middleware

Automatic GET response caching:

```typescript
import { cacheMiddleware } from "../../middlewares/cache.js";
router.get("/", authMiddleware, cacheMiddleware(300), handler); // 5min TTL
```

### Programmatic Cache Service

```typescript
import {
  cacheGet,
  cacheSet,
  cacheDel,
  cacheInvalidatePattern,
} from "../../services/cache.service.js";

await cacheSet("user:123", userData, 600); // 10min TTL
const cached = await cacheGet<User>("user:123");
await cacheDel("user:123");
await cacheInvalidatePattern("user:*"); // Invalidate all user caches
```

## Email Service

Uses Nodemailer. In dev without SMTP vars, auto-creates an Ethereal test account and logs preview URLs.

```env
# Optional — omit for Ethereal dev transport
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASS=pass
SMTP_FROM=noreply@example.com
```

Built-in templates: `welcomeTemplate(name)`, `passwordResetTemplate(resetUrl)`.

## File Uploads

- Storage: disk (`uploads/` directory), served as static files
- File filter: images (jpeg, png, gif, webp), PDFs, Word/Excel docs
- Max size: 10MB (configurable via `MAX_FILE_SIZE` env var)
- Metadata stored in PostgreSQL (Upload model)
- Uploaded files accessible at `/uploads/<filename>`

## Audit Logging

All critical actions are automatically logged to MongoDB:

- **Auth:** register, login, password reset
- **Users:** create, update, delete, role change
- **Uploads:** file upload, file delete

Each log entry includes: userId, userEmail, action, resource, resourceId, details, IP address, user agent, timestamp.

Admin panel includes an Audit Logs page with filtering by action, resource, user, and date range.

## Elasticsearch Search

Full-text search via Elasticsearch with automatic sync:

- Users are indexed on create/update, removed on delete
- Search endpoint: `GET /api/v1/search?q=term&index=users&page=1&limit=10`
- Supports pagination and multi-field matching

## API Versioning

Routes are organized under `/api/v1/` and `/api/v2/`:

- `v1` — all current routes
- `v2` — extends v1, demonstrates how to override specific routes
- Both versions mounted simultaneously in `app.ts`

## Shared Packages

### @base-mern/types

Shared TypeScript interfaces, enums, and Zod schemas:

- **Enums:** `UserRole`
- **Interfaces:** `IUser`, `IUpload`, `IAuditLog`, `AuthTokenPair`, `ApiResponse<T>`, `ApiErrorResponse`, `PaginatedResponse<T>`
- **Zod schemas:** `loginSchema`, `registerSchema`, `forgotPasswordSchema`, `resetPasswordSchema`, `refreshTokenSchema`, `paginationQuerySchema`, `updateUserSchema`, `changeRoleSchema`, `searchQuerySchema`, `auditLogQuerySchema`

### @base-mern/utils

Shared utility functions:

- `formatDate(date, locale?)` — Human-readable date string
- `formatCurrency(amount, currency?, locale?)` — Formatted currency
- `slugify(text)` — URL-friendly slug
- `createApiClient(config)` — API client with automatic refresh token rotation on 401

### @base-mern/config

Shared configuration: ESLint, Prettier, Jest base configs.

## Environment Variables

### API (`apps/api/.env`)

| Variable                 | Default                               | Description                                          |
| ------------------------ | ------------------------------------- | ---------------------------------------------------- |
| `NODE_ENV`               | `development`                         | development / production / test                      |
| `PORT`                   | `4100`                                | API server port                                      |
| `DATABASE_URL`           | —                                     | **Required** — PostgreSQL or MySQL connection string |
| `DATABASE_PROVIDER`      | `postgresql`                          | Database provider (`postgresql` or `mysql`)          |
| `MONGODB_URI`            | `mongodb://localhost:27018/base_mern` | MongoDB connection                                   |
| `JWT_SECRET`             | —                                     | **Required** — JWT signing key                       |
| `JWT_EXPIRES_IN`         | `7d`                                  | Legacy JWT expiry (backward compat)                  |
| `JWT_ACCESS_EXPIRES_IN`  | `15m`                                 | Access token expiry                                  |
| `JWT_REFRESH_EXPIRES_IN` | `7d`                                  | Refresh token expiry                                 |
| `REDIS_URL`              | `redis://localhost:6380`              | Redis connection                                     |
| `ELASTICSEARCH_URL`      | `http://localhost:9201`               | Elasticsearch connection                             |
| `SERVICE_NAME`           | `base-mern-api`                       | Pino log service name                                |
| `SEQ_URL`                | —                                     | Optional Seq logging URL                             |
| `SEQ_API_KEY`            | —                                     | Optional Seq API key                                 |
| `SMTP_HOST`              | —                                     | SMTP server host (optional, uses Ethereal in dev)    |
| `SMTP_PORT`              | —                                     | SMTP server port                                     |
| `SMTP_USER`              | —                                     | SMTP username                                        |
| `SMTP_PASS`              | —                                     | SMTP password                                        |
| `SMTP_FROM`              | `noreply@base-mern.dev`               | Email sender address                                 |
| `MAX_FILE_SIZE`          | `10485760` (10MB)                     | Maximum upload file size in bytes                    |

### Web (`apps/web/.env`)

| Variable              | Default                        |
| --------------------- | ------------------------------ |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4100/api/v1` |

### Admin (`apps/admin/.env`)

| Variable       | Default                        |
| -------------- | ------------------------------ |
| `VITE_API_URL` | `http://localhost:4100/api/v1` |

## Testing

All apps use **Jest** with **ts-jest** (CJS transform):

```bash
npm run test          # All tests (26 total)
npm run test:api      # API: 5 suites, 20 tests
npm run test:web      # Web: 3 suites, 3 tests
npm run test:admin    # Admin: 3 suites, 3 tests
```

### API Tests

- **Auth:** register (success, duplicate 409), login (success, wrong password 401), me (missing token 401)
- **Users:** list (admin 200, non-admin 403, unauth 401), self-delete prevention, role change
- **Middlewares:** authorize (valid/invalid role, no user, multiple roles), validate (valid/invalid/missing)
- Uses `jest-mock-extended` for Prisma mocks, `supertest` for HTTP assertions

### Frontend Tests

- **Web:** home page rendering, login form, dashboard
- **Admin:** app render, users table, dashboard stats
- Uses `@testing-library/react` + `jest-environment-jsdom`

## CI/CD

### GitHub Actions (`.github/workflows/ci.yml`)

Triggered on push/PR to `main`/`develop`:

1. **lint** — ESLint + Prettier check
2. **type-check** — TypeScript compilation check
3. **test** — Jest with service containers (PostgreSQL, MongoDB, Redis)
4. **build** — Production build (depends on all 3 above passing)

### Deployment Template (`.github/workflows/deploy.yml`)

Manual trigger (`workflow_dispatch`) with environment selection (staging/production). Placeholder for Docker/Vercel/Railway deployment.

## Docker Services

| Service       | Image              | Host Port                    | Container Port |
| ------------- | ------------------ | ---------------------------- | -------------- |
| PostgreSQL    | postgres:16-alpine | `54320`                      | `5432`         |
| MongoDB       | mongo:7            | `27018`                      | `27017`        |
| Redis         | redis:7-alpine     | `6380`                       | `6379`         |
| Elasticsearch | elasticsearch:8    | `9201`                       | `9200`         |
| MySQL         | mysql:8            | `33060`                      | `3306`         |
| Seq           | datalust/seq       | `8081` (UI), `5341` (ingest) | `80`, `5341`   |

```bash
docker compose up -d     # Start all services
docker compose down      # Stop all
```

## Code Quality

Run all quality gates before committing:

```bash
npm run check         # format:check + lint + type-check
npm run type-check    # tsc --noEmit across all apps
npm run lint          # ESLint all
npm run format:check  # Prettier check
```

## Adding a New Module to the API

1. Create `apps/api/src/modules/<name>/` with: controller, service, repository, routes, schemas
2. Add Prisma models to `schema.prisma` (and both provider schemas)
3. Register routes in `apps/api/src/routes/v1/index.ts`
4. Add shared types/schemas to `packages/types/src/index.ts`
5. Run `npm run db:migrate` if you added Prisma models

## Adding shadcn/ui Components

```bash
cd apps/web && npx shadcn@latest add <component>
cd apps/admin && npx shadcn@latest add <component>
```

## Ports

| Service       | Port  |
| ------------- | ----- |
| API           | 4100  |
| Web (Next.js) | 4200  |
| Admin (Vite)  | 4300  |
| PostgreSQL    | 54320 |
| MongoDB       | 27018 |
| Redis         | 6380  |
| Elasticsearch | 9201  |
| MySQL         | 33060 |
| Seq UI        | 8081  |
