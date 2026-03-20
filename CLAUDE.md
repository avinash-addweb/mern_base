# Base MERN — Monorepo Skeleton

Production-ready MERN monorepo skeleton (AddWeb). npm workspaces, TypeScript strict, ES modules throughout.

## Architecture

```
base_mern/
├── apps/
│   ├── api/          # Express 5 REST API          → localhost:4100
│   ├── web/          # Next.js 15 App Router       → localhost:4200
│   └── admin/        # Vite + React Router 7 SPA   → localhost:4300
├── packages/
│   ├── types/        # @base-mern/types — shared Zod schemas, TS interfaces, enums
│   ├── utils/        # @base-mern/utils — createApiClient, formatDate, formatCurrency, slugify
│   └── config/       # @base-mern/config — shared ESLint, Prettier, Jest configs
├── .github/workflows/ # CI/CD pipelines (ci.yml, deploy.yml)
├── docker-compose.yml
├── tsconfig.base.json
└── package.json      # workspaces: ["apps/*", "packages/*"]
```

## Commands

```bash
# Development
npm run dev              # Start all 3 apps concurrently
npm run dev:api          # API only
npm run dev:web          # Web only
npm run dev:admin        # Admin only

# Build & Quality
npm run build            # Build all apps
npm run lint             # ESLint all
npm run type-check       # TypeScript check all
npm run format           # Prettier write
npm run format:check     # Prettier check
npm run check            # Run format:check + lint + type-check

# Tests
npm run test             # All tests
npm run test:api         # API tests only
npm run test:web         # Web tests only
npm run test:admin       # Admin tests only

# Database
npm run db:generate      # npx prisma generate (in apps/api)
npm run db:migrate       # npx prisma migrate dev (in apps/api)
npm run db:seed          # Seed admin + sample users
npm run db:setup         # Select DB provider schema (postgresql/mysql)
npm run db:studio        # npx prisma studio

# Docker
docker compose up -d     # Start all services (MongoDB, Postgres, Redis, Elasticsearch, MySQL, Seq)
docker compose down      # Stop all

# shadcn/ui components
cd apps/web && npx shadcn@latest add <component>
cd apps/admin && npx shadcn@latest add <component>
```

## Database Strategy

- **PostgreSQL** (Prisma) — Relational data: users, uploads, refresh tokens, anything needing ACID/joins
- **MySQL** (Prisma) — Alternative to PostgreSQL, selectable via `DATABASE_PROVIDER=mysql`
- **MongoDB** (Mongoose) — Documents: audit logs, analytics, flexible/nested schemas
- **Redis** — Caching, sessions, rate limiting
- **Elasticsearch** — Full-text search, aggregations

### Multi-Database Provider Support

Prisma supports both PostgreSQL and MySQL via build-time schema selection:

- `apps/api/src/prisma/schema.postgresql.prisma` — PostgreSQL variant
- `apps/api/src/prisma/schema.mysql.prisma` — MySQL variant
- `apps/api/scripts/select-schema.js` — copies the correct schema based on `DATABASE_PROVIDER` env var

To switch: set `DATABASE_PROVIDER=mysql` + `DATABASE_URL=mysql://...` in `.env`, then `npm run db:setup && npm run db:migrate`.

## Service Connections & Usage

All services connect at startup in `apps/api/src/index.ts`. If any connection fails, the process exits (`logger.fatal` + `process.exit(1)`).

### PostgreSQL (Prisma)

Config: `apps/api/src/config/prisma.ts` — singleton client, cached on `globalThis` in dev to survive HMR.

```typescript
import { prisma } from "../../config/prisma.js";

// CRUD
const user = await prisma.user.findUnique({ where: { id } });
const users = await prisma.user.findMany({
  where: { role: "ADMIN" },
  select: { id: true, name: true },
});
const created = await prisma.user.create({ data: { email, name, password } });
const updated = await prisma.user.update({ where: { id }, data: { name } });
const deleted = await prisma.user.delete({ where: { id } });

// Pagination (use the paginate helper)
import { paginate } from "../../utils/paginate.js";
const result = await paginate(
  prisma.user,
  { page: 1, limit: 10, sortOrder: "desc" },
  { where: { role: "USER" } },
);
// Returns: { data: T[], pagination: { page, limit, total, totalPages } }

// Raw query
await prisma.$queryRaw`SELECT 1`;

// Transactions
await prisma.$transaction([prisma.user.update({ where: { id }, data: { role: "ADMIN" } })]);
```

**Prisma Models:**

- `User` — id, email, name, password, role, resetToken, resetTokenExp, uploads[], refreshTokens[]
- `Upload` — id, filename, originalName, mimetype, size, path, uploadedBy (FK)
- `RefreshToken` — id, token (unique), userId (FK), expiresAt, revoked

Schema: `apps/api/src/prisma/schema.prisma` | Migrations: `apps/api/src/prisma/migrations/`

### MongoDB (Mongoose)

Config: `apps/api/src/config/db.ts` — connects via `mongoose.connect(env.MONGODB_URI)`.

```typescript
import mongoose from "mongoose";

// Define a model (create in modules/<name>/<name>.model.ts)
const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: String,
    tags: [String],
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true },
);

export const Post = mongoose.model("Post", postSchema);

// Usage
const post = await Post.create({ title: "Hello", content: "World" });
const posts = await Post.find({ tags: "typescript" }).sort({ createdAt: -1 }).limit(10);
const updated = await Post.findByIdAndUpdate(id, { title: "Updated" }, { new: true });
await Post.deleteOne({ _id: id });
```

**Existing Mongoose model:** `AuditLog` in `apps/api/src/modules/audit/audit.model.ts` — stores audit trail entries.

Connection state: `mongoose.connection.readyState` (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)

### Redis (ioredis)

Config: `apps/api/src/config/redis.ts` — lazy-connect singleton.

```typescript
import { getRedisClient } from "../../config/redis.js";

const redis = getRedisClient();

// Key-value
await redis.set("key", "value");
await redis.set("key", "value", "EX", 3600); // expires in 1 hour
const value = await redis.get("key");
await redis.del("key");

// JSON (serialize manually)
await redis.set(`user:${id}`, JSON.stringify(user), "EX", 600);
const cached = await redis.get(`user:${id}`);
const user = cached ? JSON.parse(cached) : null;

// Hash
await redis.hset("user:1", { name: "Alice", role: "admin" });
const name = await redis.hget("user:1", "name");
const all = await redis.hgetall("user:1");

// Lists / Sets
await redis.lpush("queue", JSON.stringify(job));
await redis.sadd("online-users", userId);
await redis.sismember("online-users", userId);

// TTL & existence
const ttl = await redis.ttl("key");
const exists = await redis.exists("key");

// Ping
const pong = await redis.ping(); // "PONG"
```

Exports: `connectRedis()`, `getRedisClient()`, `disconnectRedis()`

#### Cache Service (`apps/api/src/services/cache.service.ts`)

```typescript
import {
  cacheGet,
  cacheSet,
  cacheDel,
  cacheInvalidatePattern,
  buildCacheKey,
} from "../../services/cache.service.js";

await cacheSet("user:123", userData, 600); // 10min TTL
const cached = await cacheGet<User>("user:123");
await cacheDel("user:123");
await cacheInvalidatePattern("user:*"); // Invalidate by pattern
const key = buildCacheKey("users", { page: 1 }); // "users:page=1"
```

#### Cache Middleware (`apps/api/src/middlewares/cache.ts`)

```typescript
import { cacheMiddleware } from "../../middlewares/cache.js";
router.get("/", authMiddleware, cacheMiddleware(300), handler); // Cache GET responses for 5min
```

### Elasticsearch (@elastic/elasticsearch)

Config: `apps/api/src/config/elasticsearch.ts` — singleton client.

```typescript
import { getElasticsearchClient } from "../../config/elasticsearch.js";

const es = getElasticsearchClient();

// Index a document
await es.index({
  index: "posts",
  id: post.id,
  document: { title: post.title, content: post.content, createdAt: post.createdAt },
});

// Search
const result = await es.search({
  index: "posts",
  query: {
    multi_match: { query: "search term", fields: ["title", "content"] },
  },
  size: 10,
  from: 0,
});
const hits = result.hits.hits.map((h) => h._source);

// Delete
await es.delete({ index: "posts", id: post.id });

// Check index exists
const exists = await es.indices.exists({ index: "posts" });

// Create index with mappings
await es.indices.create({
  index: "posts",
  mappings: {
    properties: {
      title: { type: "text" },
      content: { type: "text" },
      createdAt: { type: "date" },
    },
  },
});
```

Exports: `connectElasticsearch()`, `getElasticsearchClient()`, `disconnectElasticsearch()`

#### Elasticsearch Service (`apps/api/src/services/elasticsearch.service.ts`)

```typescript
import {
  ensureIndex,
  indexDocument,
  searchDocuments,
  deleteDocument,
} from "../../services/elasticsearch.service.js";

// Ensure index with mappings
await ensureIndex("users", {
  name: { type: "text" },
  email: { type: "text" },
  role: { type: "keyword" },
});

// Index a document
await indexDocument("users", user.id, { name: user.name, email: user.email, role: user.role });

// Search
const results = await searchDocuments("users", "john", ["name", "email"], 1, 10);
// Returns: { hits: T[], total: number }

// Delete from index
await deleteDocument("users", user.id);
```

Users are auto-synced to the `users` ES index on create/update/delete via `users.service.ts`.

### Email Service (`apps/api/src/services/email.service.ts`)

```typescript
import { sendEmail, initializeEmailTransport } from "../../services/email.service.js";
import { passwordResetTemplate, welcomeTemplate } from "../../services/email.templates.js";

// Initialize at startup (called in index.ts)
await initializeEmailTransport(); // Uses Ethereal in dev without SMTP vars

// Send email
const template = passwordResetTemplate("https://example.com/reset?token=abc");
await sendEmail({ to: "user@example.com", subject: template.subject, html: template.html });
```

### Docker Ports (host → container)

| Service       | Host Port                    | Container Port | Dashboard               |
| ------------- | ---------------------------- | -------------- | ----------------------- |
| PostgreSQL    | `54320`                      | `5432`         | —                       |
| MongoDB       | `27018`                      | `27017`        | —                       |
| Redis         | `6380`                       | `6379`         | —                       |
| Elasticsearch | `9201`                       | `9200`         | —                       |
| MySQL         | `33060`                      | `3306`         | —                       |
| Seq           | `8081` (UI), `5341` (ingest) | `80`, `5341`   | `http://localhost:8081` |

### Health Check

`GET /api/v1/health` — returns connection status of all services + uptime. Use to verify all services are running.

## Environment Variables

### API (`apps/api/.env`)

| Variable                 | Default                               | Description                                          |
| ------------------------ | ------------------------------------- | ---------------------------------------------------- |
| `NODE_ENV`               | `development`                         | development / production / test                      |
| `PORT`                   | `4100`                                | API server port                                      |
| `DATABASE_URL`           | —                                     | **Required** — PostgreSQL or MySQL connection string |
| `DATABASE_PROVIDER`      | `postgresql`                          | Database provider (`postgresql` or `mysql`)          |
| `MONGODB_URI`            | `mongodb://localhost:27018/base_mern` | MongoDB                                              |
| `JWT_SECRET`             | —                                     | **Required** — JWT signing key                       |
| `JWT_EXPIRES_IN`         | `7d`                                  | Legacy JWT token expiry (backward compat)            |
| `JWT_ACCESS_EXPIRES_IN`  | `15m`                                 | Access token expiry                                  |
| `JWT_REFRESH_EXPIRES_IN` | `7d`                                  | Refresh token expiry                                 |
| `SERVICE_NAME`           | `base-mern-api`                       | Pino log service name                                |
| `REDIS_URL`              | `redis://localhost:6380`              | Redis                                                |
| `ELASTICSEARCH_URL`      | `http://localhost:9201`               | Elasticsearch                                        |
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

---

## API Patterns (apps/api)

### Module Structure

Every API feature lives in `apps/api/src/modules/<name>/` with these files:

```
modules/<name>/
├── <name>.controller.ts   # HTTP handlers — parse req, call service, send res
├── <name>.service.ts      # Business logic — validation, orchestration
├── <name>.repository.ts   # Data access — Prisma/Mongoose queries
├── <name>.routes.ts       # Express Router + Swagger JSDoc annotations
├── <name>.schemas.ts      # Zod request schemas (wraps @base-mern/types)
└── <name>.utils.ts        # Optional module-specific helpers
```

### Existing Modules

| Module    | Path               | Database      | Description                                            |
| --------- | ------------------ | ------------- | ------------------------------------------------------ |
| `auth`    | `modules/auth/`    | Prisma        | Register, login, forgot/reset password, refresh/logout |
| `users`   | `modules/users/`   | Prisma        | Admin-only user CRUD with pagination                   |
| `uploads` | `modules/uploads/` | Prisma        | File upload (single, multiple, delete)                 |
| `audit`   | `modules/audit/`   | Mongoose      | Audit log recording + admin query endpoint             |
| `search`  | `modules/search/`  | Elasticsearch | Full-text search across indexed data                   |
| `health`  | `modules/health/`  | All           | Health check for all service connections               |

### New Module Template

#### 1. Schema — `modules/<name>/<name>.schemas.ts`

```typescript
import { z } from "zod";

// Define field schemas in packages/types/src/index.ts first, then wrap here:
export const create<Name>Schema = z.object({
  body: z.object({
    field: z.string().min(1, "Field is required"),
  }),
});

export type Create<Name>Input = z.infer<typeof create<Name>Schema>["body"];
```

#### 2. Repository — `modules/<name>/<name>.repository.ts`

```typescript
import { prisma } from "../../config/prisma.js";

const <name>Select = {
  id: true,
  // ... fields to return (never return passwords)
} as const;

export const <name>Repository = {
  async findAll() {
    return prisma.<model>.findMany({ select: <name>Select });
  },

  async findById(id: string) {
    return prisma.<model>.findUnique({ where: { id }, select: <name>Select });
  },

  async create(data: { /* typed fields */ }) {
    return prisma.<model>.create({ data, select: <name>Select });
  },
};
```

#### 3. Service — `modules/<name>/<name>.service.ts`

```typescript
import { AppError } from "../../middlewares/errorHandler.js";
import { <name>Repository } from "./<name>.repository.js";

export const <name>Service = {
  async create(input: { /* typed */ }) {
    // Business logic, validation, orchestration
    // Throw AppError for expected errors:
    // throw new AppError("Not found", 404, "<NAME>_NOT_FOUND");
    return <name>Repository.create(input);
  },
};
```

#### 4. Controller — `modules/<name>/<name>.controller.ts`

```typescript
import { Request, Response, NextFunction } from "express";
import { <name>Service } from "./<name>.service.js";

export async function create<Name>(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await <name>Service.create(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getAll<Name>s(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await <name>Service.getAll();
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
}
```

#### 5. Routes — `modules/<name>/<name>.routes.ts`

```typescript
import { Router } from "express";
import { create<Name>, getAll<Name>s } from "./<name>.controller.js";
import { authMiddleware } from "../../middlewares/auth.js";
import { authorize } from "../../middlewares/authorize.js";
import { validate } from "../../middlewares/validate.js";
import { create<Name>Schema } from "./<name>.schemas.js";
import { UserRole } from "@base-mern/types";

const router = Router();

router.get("/", authMiddleware, authorize(UserRole.ADMIN), getAll<Name>s);
router.post("/", authMiddleware, validate(create<Name>Schema), create<Name>);

export default router;
```

#### 6. Register Routes — `apps/api/src/routes/v1/index.ts`

```typescript
import <name>Routes from "../../modules/<name>/<name>.routes.js";
router.use("/<name>", <name>Routes);
```

### Middleware Usage

```typescript
// Authentication — adds req.user (IUser)
import { authMiddleware } from "../../middlewares/auth.js";
router.get("/protected", authMiddleware, handler);

// Authorization — checks req.user.role (use AFTER authMiddleware)
import { authorize } from "../../middlewares/authorize.js";
import { UserRole } from "@base-mern/types";
router.get("/admin-only", authMiddleware, authorize(UserRole.ADMIN), handler);
// Multiple roles: authorize(UserRole.ADMIN, UserRole.USER)

// Validation — parses req.body/query/params against Zod schema
import { validate } from "../../middlewares/validate.js";
router.post("/", validate(mySchema), handler);

// Cache — automatic GET response caching via Redis
import { cacheMiddleware } from "../../middlewares/cache.js";
router.get("/", authMiddleware, cacheMiddleware(300), handler); // 5min TTL

// Audit — automatic action logging (alternative to calling auditService directly)
import { auditAction } from "../../middlewares/audit.js";
router.delete(
  "/:id",
  authMiddleware,
  authorize(UserRole.ADMIN),
  handler,
  auditAction("DELETED", "resource"),
);

// Rate limiting
import { globalLimiter, authLimiter } from "../../middlewares/rateLimiter.js";
router.post("/login", authLimiter, handler); // 10 req/15min
// globalLimiter already applied to all routes: 100 req/15min
```

### Audit Logging (from services)

```typescript
import { auditService } from "../audit/audit.service.js";

// Call directly from service methods for precise control
auditService
  .logAction({
    userId,
    userEmail,
    action: "USER_UPDATED",
    resource: "user",
    resourceId: id,
    details: { oldRole, newRole },
  })
  .catch(() => {}); // Fire-and-forget
```

Actions are logged from: `auth.service.ts` (register, login, password reset), `users.service.ts` (CRUD, role change), `uploads.service.ts` (upload, delete).

### Logging (Pino)

All server logging uses **Pino** — never use `console.log`. Config: `apps/api/src/config/logger.ts`.

```typescript
import { logger } from "../../config/logger.js";

// Basic usage
logger.info("User registered");
logger.warn("Deprecated endpoint called");
logger.error("Payment processing failed");

// Structured logging — ALWAYS pass object first, message second
logger.info({ userId: user.id, email: user.email }, "User registered");
logger.error({ err, orderId }, "Payment processing failed");
logger.warn({ endpoint: req.path, userId: req.user?.id }, "Deprecated endpoint called");

// Log levels: fatal > error > warn > info > debug > trace
// Default level: "info" (silent in test)
```

**Transports by environment:**
| Environment | Transport | Output |
|---|---|---|
| `development` | `pino-pretty` | Colorized console output |
| `production` | `pino/file` | JSON to stdout |
| Any (if `SEQ_URL` set) | `pino-seq` | Structured logs to Seq dashboard |

**HTTP request logging** is automatic via `pino-http` middleware in `app.ts`:

- Every request/response is logged automatically
- Each request gets a `traceId` (from `x-request-id` header or auto-generated UUID)
- Access via `req.log` inside route handlers for request-scoped logging:

```typescript
export async function myHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  req.log.info({ action: "processing" }, "Handling request"); // includes traceId automatically
}
```

**Error logging** is handled automatically by the `errorHandler` middleware:

- `AppError` with statusCode >= 500 → `logger.error`
- `AppError` with statusCode < 500 → `logger.warn`
- Unhandled errors → `logger.error` with `errorCode: "INTERNAL_ERROR"`
- All error logs include: `err`, `errorCode`, `errorType`, `component`, `statusCode`

**Base fields** included in every log entry: `service` (SERVICE_NAME), `environment` (NODE_ENV), ISO timestamp.

**Seq dashboard:** Available at `http://localhost:8081` when running via Docker.

### Response Format

```typescript
// Success
res.json({
  success: true,
  data: {
    /* payload */
  },
});
res.status(201).json({
  success: true,
  data: {
    /* payload */
  },
});

// Paginated
res.json({
  success: true,
  data: items,
  pagination: { page, limit, total, totalPages },
});

// Errors (thrown via AppError, handled by errorHandler middleware)
throw new AppError("Message", 404, "ERROR_CODE");
throw new AppError("Validation failed", 400, "VALIDATION_ERROR", { field: ["error msg"] });
```

### AppError Class

```typescript
import { AppError } from "../../middlewares/errorHandler.js";

// constructor(message: string, statusCode: number, errorCode?: string, details?: Record<string, string[]>)
throw new AppError("Email already registered", 409, "AUTH_EMAIL_EXISTS");
throw new AppError("Not found", 404, "RESOURCE_NOT_FOUND");
throw new AppError("Validation failed", 400, "VALIDATION_ERROR", { email: ["Invalid email"] });
```

### Prisma — Adding a New Model

1. Edit both `schema.postgresql.prisma` and `schema.mysql.prisma` in `apps/api/src/prisma/`
2. Run: `npm run db:migrate` (auto-runs `select-schema.js` first, then creates migration + generates client)
3. Use in repository: `import { prisma } from "../../config/prisma.js";`

### Swagger / OpenAPI

- Annotations go in `*.routes.ts` files as JSDoc comments
- Swagger UI served at `http://localhost:4100/api-docs`
- Config in `apps/api/src/config/swagger.ts`
- Scans both `v1` and `v2` route directories
- Add shared schemas to `components.schemas` in swagger config
- Use `$ref: '#/components/schemas/SchemaName'` to reference

### API Versioning

Routes are organized under `/api/v1/` and `/api/v2/`:

- `apps/api/src/routes/v1/index.ts` — all current route registrations
- `apps/api/src/routes/v2/index.ts` — extends v1, shows how to override specific routes
- `apps/api/src/routes/index.ts` — barrel re-export of v1 for backward compat
- Both versions mounted in `app.ts`: `app.use("/api/v1", v1Routes)` and `app.use("/api/v2", v2Routes)`

### Pagination Helper

```typescript
import { paginate } from "../../utils/paginate.js";
import type { PaginationQuery } from "@base-mern/types";

// Generic pagination for any Prisma model
const result = await paginate(prisma.user, query, {
  where: { role: "USER" },
  select: { id: true, name: true, email: true },
});
// Returns: { data: T[], pagination: { page, limit, total, totalPages } }
```

### File Upload (Multer)

```typescript
import { upload } from "../../modules/uploads/uploads.utils.js";

// Single file
router.post("/", authMiddleware, upload.single("file"), handler);

// Multiple files (max 10)
router.post("/multiple", authMiddleware, upload.array("files", 10), handler);
```

Config: disk storage, filename = `Date.now()-uuid.ext`, filters for images/PDFs/docs, max 10MB (via `MAX_FILE_SIZE` env).
Files served as static at `/uploads/<filename>`.

---

## Frontend Patterns

### Next.js Web App (apps/web)

#### New Page

Create `apps/web/src/app/<route>/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { someSchema } from "@base-mern/types";
import type { SomeInput } from "@base-mern/types";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api";

export default function MyPage() {
  const { user } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<SomeInput>({
    resolver: zodResolver(someSchema),
  });

  async function onSubmit(data: SomeInput) {
    await apiFetch("/endpoint", { method: "POST", body: JSON.stringify(data) });
  }

  return ( /* JSX */ );
}
```

#### Existing Pages

- `/` — Home page
- `/login` — Login form
- `/register` — Registration form
- `/dashboard` — Dashboard (protected)
- `/profile` — User profile (protected)
- `/forgot-password` — Request password reset email (guest)
- `/reset-password` — Set new password with token from URL (guest)

#### Route Protection

- **Middleware-based** in `apps/web/src/middleware.ts`
- Protected paths: `/dashboard/*`, `/profile/*` — redirects to `/login` if no `auth_token` cookie
- Guest paths: `/login`, `/register`, `/forgot-password`, `/reset-password` — redirects to `/dashboard` if has token
- To add protected paths: edit the `matcher` array and add conditions

#### Auth Context

```tsx
import { useAuth } from "@/hooks/useAuth";

const { user, token, loading, login, register, logout } = useAuth();
// user: IUser | null
// login(email, password): Promise<void> — returns accessToken + refreshToken
// register(name, email, password): Promise<void>
// accessToken stored in cookie: auth_token
// refreshToken stored in cookie: refresh_token
// Automatic token refresh on 401
```

### Admin Vite App (apps/admin)

#### New Page

1. Create `apps/admin/src/pages/<Name>.tsx`:

```tsx
import { useState } from "react";
import { useApiQuery } from "@/hooks/useApiQuery";

export default function MyPage() {
  const { data, loading, error, refetch } = useApiQuery<SomeType>("/endpoint");

  if (loading) return <div>Loading...</div>;
  return ( /* JSX */ );
}
```

2. Register route in `apps/admin/src/App.tsx`:

```tsx
import MyPage from "./pages/MyPage";

// Inside <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
<Route path="/my-page" element={<MyPage />} />;
```

3. Add sidebar link in `apps/admin/src/components/layout/Sidebar.tsx`:

```tsx
import { MyIcon } from "lucide-react";

const navItems = [
  // ... existing items
  { label: "My Page", icon: MyIcon, to: "/my-page" },
];
```

#### Existing Admin Pages

- `/` — Dashboard (real user count from API)
- `/users` — User management (paginated table, edit/delete/role change)
- `/audit-logs` — Audit log viewer (filterable by action, resource, user, date range)

#### Auth Context (Admin)

```tsx
import { useAuth } from "@/hooks/useAuth";

const { user, token, loading, login, logout } = useAuth();
// Admin-only: rejects non-ADMIN users at login
// accessToken stored in localStorage
// refreshToken stored in localStorage
// Automatic token refresh on 401
```

### API Client

```typescript
// Web (apps/web/src/lib/api.ts) — reads token from cookie, supports refresh
import { apiFetch } from "@/lib/api";
const data = await apiFetch<ApiResponse<MyType>>("/endpoint");
const created = await apiFetch<ApiResponse<MyType>>("/endpoint", {
  method: "POST",
  body: JSON.stringify(payload),
});

// Admin (apps/admin/src/lib/api.ts) — reads token from localStorage, supports refresh
// Same interface, different token source
```

### useApiQuery Hook

```typescript
import { useApiQuery } from "@/hooks/useApiQuery";

const { data, loading, error, refetch } = useApiQuery<ApiResponse<MyType>>("/endpoint");
```

### Form Pattern (react-hook-form + Zod)

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mySchema } from "@base-mern/types";
import type { MyInput } from "@base-mern/types";
import { FormField } from "@/components/ui/form-field";

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm<MyInput>({
  resolver: zodResolver(mySchema),
});

// In JSX:
<form onSubmit={handleSubmit(onSubmit)}>
  <FormField id="name" label="Name" error={errors.name?.message} {...register("name")} />
  <Button type="submit">Submit</Button>
</form>;
```

### UI Components (shadcn/ui)

Both apps use shadcn/ui with CVA + Tailwind CSS v4 + CSS variables for theming.

- `Button` — variants: default, destructive, outline, secondary, ghost, link; sizes: default, sm, lg, icon
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- `Input`, `Label`
- `FormField` — composed Input + Label + error display
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` (admin)
- `Pagination` (admin)
- `cn()` helper from `@/lib/utils` for className merging (clsx + tailwind-merge)

---

## Shared Packages

### @base-mern/types (`packages/types/src/index.ts`)

```typescript
// Enums
export enum UserRole { USER = "USER", ADMIN = "ADMIN" }

// Interfaces
export interface IUser { id: string; email: string; name: string; role: UserRole; createdAt: Date; updatedAt: Date; }
export interface IUpload { id: string; filename: string; originalName: string; mimetype: string; size: number; path: string; uploadedBy: string; createdAt: Date; }
export interface IAuditLog { _id: string; userId: string; userEmail: string; action: string; resource: string; resourceId?: string; details?: Record<string, unknown>; ipAddress?: string; userAgent?: string; createdAt: Date; updatedAt: Date; }
export interface AuthTokenPair { accessToken: string; refreshToken: string; }
export interface ApiResponse<T> { success: boolean; data: T; message?: string; }
export interface ApiErrorResponse { success: false; message: string; errorCode?: string; errors?: Record<string, string[]>; details?: Record<string, string[]>; }
export interface PaginatedResponse<T> { success: boolean; data: T[]; pagination: { page: number; limit: number; total: number; totalPages: number; }; }

// Zod schemas + inferred types
export const loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema, refreshTokenSchema
export const paginationQuerySchema, updateUserSchema, changeRoleSchema, searchQuerySchema, auditLogQuerySchema
export type LoginInput, RegisterInput, ForgotPasswordInput, ResetPasswordInput, PaginationQuery
export type UpdateUserInput, ChangeRoleInput, SearchQuery, AuditLogQuery
```

**To add types:** Edit `packages/types/src/index.ts`. No build step needed — consumed via direct TS source.

### @base-mern/utils (`packages/utils/src/index.ts`)

```typescript
export function formatDate(date: Date | string, locale?: string): string;
export function formatCurrency(amount: number, currency?: string, locale?: string): string;
export function slugify(text: string): string;
export function createApiClient(config: {
  baseUrl: string;
  getToken: () => string | null;
  getRefreshToken?: () => string | null;
  onRefresh?: (refreshToken: string) => Promise<{ accessToken: string; refreshToken: string }>;
  onAuthFailure?: () => void;
}): <T>(endpoint: string, options?: RequestInit) => Promise<T>;
```

`createApiClient` handles automatic 401 → refresh token → retry flow.

### @base-mern/config (`packages/config/`)

- `eslint.config.js` — typescript-eslint + prettier, `_` prefix ignores unused vars
- `prettier.config.js` — double quotes, semicolons, trailing commas, 100 print width
- `jest.config.js` — ts-jest, node environment

---

## Key File Paths

### API

- `apps/api/src/index.ts` — Entry point, connects DBs, initializes email, starts server
- `apps/api/src/app.ts` — Express app setup, middleware stack, static uploads, v1/v2 route mounting
- `apps/api/src/routes/v1/index.ts` — **v1 route registration** (add new module routes here)
- `apps/api/src/routes/v2/index.ts` — v2 route registration (extends v1)
- `apps/api/src/routes/index.ts` — Barrel re-export of v1
- `apps/api/src/config/env.ts` — Zod env validation
- `apps/api/src/config/prisma.ts` — Prisma client singleton
- `apps/api/src/config/db.ts` — MongoDB connection
- `apps/api/src/config/redis.ts` — Redis connection
- `apps/api/src/config/elasticsearch.ts` — Elasticsearch connection
- `apps/api/src/config/logger.ts` — Pino logger setup
- `apps/api/src/config/swagger.ts` — Swagger/OpenAPI config
- `apps/api/src/middlewares/auth.ts` — JWT auth middleware
- `apps/api/src/middlewares/authorize.ts` — RBAC role-check middleware
- `apps/api/src/middlewares/validate.ts` — Zod validation middleware
- `apps/api/src/middlewares/cache.ts` — Redis GET response cache middleware
- `apps/api/src/middlewares/audit.ts` — Audit action logging middleware
- `apps/api/src/middlewares/errorHandler.ts` — AppError class + error handler
- `apps/api/src/middlewares/rateLimiter.ts` — Rate limiters (global: 100/15m, auth: 10/15m)
- `apps/api/src/modules/auth/` — Auth module (register, login, forgot/reset password, refresh, logout)
- `apps/api/src/modules/users/` — User CRUD module (admin-only)
- `apps/api/src/modules/uploads/` — File upload module
- `apps/api/src/modules/audit/` — Audit log module (MongoDB)
- `apps/api/src/modules/search/` — Elasticsearch search module
- `apps/api/src/modules/health/` — Health check endpoint
- `apps/api/src/services/cache.service.ts` — Programmatic Redis cache helpers
- `apps/api/src/services/email.service.ts` — Nodemailer transport + send helpers
- `apps/api/src/services/email.templates.ts` — Email templates (password reset, welcome)
- `apps/api/src/services/elasticsearch.service.ts` — Generic ES index/search/delete helpers
- `apps/api/src/utils/paginate.ts` — Generic Prisma pagination helper
- `apps/api/src/prisma/schema.prisma` — **Active database schema**
- `apps/api/src/prisma/schema.postgresql.prisma` — PostgreSQL schema variant
- `apps/api/src/prisma/schema.mysql.prisma` — MySQL schema variant
- `apps/api/src/prisma/seed.ts` — Database seed script
- `apps/api/scripts/select-schema.js` — DB provider schema selector
- `apps/api/src/types/express.d.ts` — Express Request augmentation (req.user)

### Web (Next.js)

- `apps/web/src/app/layout.tsx` — Root layout (AuthProvider + Navbar + ErrorBoundary)
- `apps/web/src/app/page.tsx` — Home page
- `apps/web/src/app/login/page.tsx` — Login (reference form implementation)
- `apps/web/src/app/register/page.tsx` — Register
- `apps/web/src/app/dashboard/page.tsx` — Dashboard (protected)
- `apps/web/src/app/profile/page.tsx` — Profile (protected)
- `apps/web/src/app/forgot-password/page.tsx` — Forgot password (guest)
- `apps/web/src/app/reset-password/page.tsx` — Reset password with token (guest)
- `apps/web/src/middleware.ts` — Next.js route protection
- `apps/web/src/contexts/AuthContext.tsx` — Auth context (cookie-based, refresh token support)
- `apps/web/src/hooks/useAuth.ts` — Auth hook
- `apps/web/src/hooks/useApiQuery.ts` — API query hook
- `apps/web/src/lib/api.ts` — API client (cookie token, auto-refresh)
- `apps/web/src/lib/utils.ts` — cn() helper
- `apps/web/src/components/ui/` — shadcn/ui components
- `apps/web/components.json` — shadcn/ui config

### Admin (Vite)

- `apps/admin/src/App.tsx` — **Route registration** (add pages here)
- `apps/admin/src/main.tsx` — Entry point
- `apps/admin/src/pages/Dashboard.tsx` — Dashboard with real user count
- `apps/admin/src/pages/Users.tsx` — User management (CRUD, pagination)
- `apps/admin/src/pages/AuditLogs.tsx` — Audit log viewer with filters
- `apps/admin/src/contexts/AuthContext.tsx` — Auth context (localStorage, admin-only, refresh token support)
- `apps/admin/src/hooks/useAuth.ts` — Auth hook
- `apps/admin/src/hooks/useApiQuery.ts` — API query hook
- `apps/admin/src/lib/api.ts` — API client (localStorage token, auto-refresh)
- `apps/admin/src/lib/utils.ts` — cn() helper
- `apps/admin/src/components/layout/AdminLayout.tsx` — Admin shell (header + sidebar + outlet)
- `apps/admin/src/components/layout/Sidebar.tsx` — **Sidebar nav** (add links here)
- `apps/admin/src/components/users/UserTable.tsx` — User table with edit/delete/role actions
- `apps/admin/src/components/ui/` — shadcn/ui components
- `apps/admin/src/components/ProtectedRoute.tsx` — Admin-only route guard
- `apps/admin/src/components/GuestRoute.tsx` — Guest-only route guard
- `apps/admin/components.json` — shadcn/ui config
- `apps/admin/vite.config.ts` — Vite config (proxy /api → localhost:4100)

### Testing

- `apps/api/__tests__/helpers/test-setup.ts` — Mock setup (Prisma, Redis, ES, email, audit, logger)
- `apps/api/__tests__/helpers/mock-factories.ts` — `createMockUser()`, `createMockAdmin()`, `createMockToken()`
- `apps/api/__tests__/auth.test.ts` — Auth endpoint tests
- `apps/api/__tests__/users.test.ts` — User CRUD endpoint tests
- `apps/api/__tests__/health.test.ts` — Health check tests
- `apps/api/__tests__/middlewares/authorize.test.ts` — RBAC middleware unit tests
- `apps/api/__tests__/middlewares/validate.test.ts` — Validation middleware unit tests
- `apps/web/__tests__/` — Web frontend tests (page, login, dashboard)
- `apps/admin/__tests__/` — Admin frontend tests (App, Users, Dashboard)

### CI/CD

- `.github/workflows/ci.yml` — Main CI pipeline (lint, type-check, test, build)
- `.github/workflows/deploy.yml` — Deployment template (manual trigger)

### Shared

- `packages/types/src/index.ts` — **All shared types, enums, Zod schemas**
- `packages/utils/src/index.ts` — **All shared utilities**
- `packages/config/` — ESLint, Prettier, Jest configs
- `tsconfig.base.json` — Base TS config (ES2024, NodeNext, strict)
- `docker-compose.yml` — All infrastructure services

---

## Coding Conventions

- TypeScript strict mode, ES modules (`"type": "module"`)
- `.js` extension in all relative imports (TS compiles to ESM)
- `_` prefix for unused variables (`_req`, `_res`, `_next`)
- Zod for all validation (API request schemas + form schemas)
- Pino for all server logging (never `console.log`)
- Double quotes, semicolons, trailing commas, 100 char print width (Prettier)
- Components: `forwardRef` pattern with `displayName`
- Styles: Tailwind CSS v4 with CSS custom properties (not Tailwind config theme)
- Path aliases: `@/` maps to `src/` in all apps
- Package references: `"@base-mern/types": "*"` and `"@base-mern/utils": "*"` in workspace
- Audit logging: call `auditService.logAction()` from service methods for critical actions
- Pagination: use the `paginate()` helper from `utils/paginate.ts` for all list endpoints
- Authorization: use `authorize(...roles)` middleware after `authMiddleware` for role-based access
