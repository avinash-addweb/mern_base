# Base MERN Monorepo

A production-ready monorepo with **Express API**, **Next.js frontend**, and **React admin panel** — all in TypeScript.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| API | Express 5, Prisma (PostgreSQL), Mongoose (MongoDB), JWT Auth, Swagger |
| Frontend | Next.js 15 (App Router, SSR), Tailwind CSS v4, shadcn/ui |
| Admin | React 19, Vite 6, React Router 7, Tailwind CSS v4, shadcn/ui |
| Shared | TypeScript, npm workspaces, ESLint 9, Prettier, Husky, lint-staged |
| Infrastructure | Docker, docker-compose, nginx |

## Folder Structure

```
base_mern/
├── apps/
│   ├── api/              # Express API (:4100)
│   ├── web/              # Next.js frontend (:4200)
│   └── admin/            # Vite React admin (:4300)
├── packages/
│   ├── config/           # Shared ESLint, Prettier, Jest configs
│   ├── types/            # Shared TypeScript interfaces
│   └── utils/            # Shared utility functions
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
- **Docker** & **Docker Compose** (optional, for containerized dev)

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

Edit `apps/api/.env` with your database credentials:

```env
NODE_ENV=development
PORT=4100
DATABASE_URL="postgresql://postgres:postgres@localhost:54320/base_mern?schema=public"
MONGODB_URI="mongodb://localhost:27018/base_mern"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
```

For the frontend apps (optional):

```bash
cp apps/web/.env.example apps/web/.env
cp apps/admin/.env.example apps/admin/.env
```

### 3. Database Setup

Make sure PostgreSQL and MongoDB are running, then:

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations (creates tables in PostgreSQL)
npm run db:migrate
```

### 4. Start Development

```bash
# Start all 3 apps concurrently
npm run dev

# Or start individually
npm run dev:api    # API on http://localhost:4100
npm run dev:web    # Frontend on http://localhost:4200
npm run dev:admin  # Admin on http://localhost:4300
```

### 5. Using Docker (Alternative)

Start everything with Docker Compose (includes MongoDB and PostgreSQL):

```bash
docker compose up
```

For production builds:

```bash
docker compose -f docker-compose.prod.yml up --build
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all 3 apps concurrently |
| `npm run dev:api` | Start API only (nodemon + tsx) |
| `npm run dev:web` | Start Next.js dev server only |
| `npm run dev:admin` | Start Vite dev server only |
| `npm run build` | Build all apps for production |
| `npm run lint` | Run ESLint across all workspaces |
| `npm run type-check` | Run `tsc --noEmit` on all apps |
| `npm run format` | Format all files with Prettier |
| `npm run format:check` | Check formatting without writing |
| `npm run test` | Run Jest tests across all workspaces |
| `npm run test:api` | Run API tests only |
| `npm run test:web` | Run frontend tests only |
| `npm run test:admin` | Run admin tests only |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio (PostgreSQL GUI) |

## API Documentation

Swagger UI is available at **http://localhost:4100/api-docs** when the API is running.

### API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/health` | Health check (pings both DBs) | No |
| `POST` | `/api/v1/auth/register` | Register a new user | No |
| `POST` | `/api/v1/auth/login` | Login with email & password | No |
| `GET` | `/api/v1/auth/me` | Get current user | Bearer Token |

### Register

```bash
curl -X POST http://localhost:4100/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "name": "John Doe", "password": "password123"}'
```

### Login

```bash
curl -X POST http://localhost:4100/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### Get Current User (Protected)

```bash
curl http://localhost:4100/api/v1/auth/me \
  -H "Authorization: Bearer <your-jwt-token>"
```

## Database Strategy

| Database | Use Case | ORM | Data |
|----------|----------|-----|------|
| **PostgreSQL** | Relational/structured data | Prisma | Users, roles, permissions, settings |
| **MongoDB** | Flexible/document data | Mongoose | Logs, activity feeds, content, analytics |

### Prisma Schema

The User model is defined in `apps/api/src/prisma/schema.prisma`:

- `id` — CUID primary key
- `email` — unique
- `name` — string
- `password` — bcrypt hashed
- `role` — enum (USER, ADMIN)
- `createdAt`, `updatedAt` — timestamps

### Prisma Studio

Browse and edit PostgreSQL data with:

```bash
npm run db:studio
```

## Authentication

- **JWT-based** authentication with `jsonwebtoken`
- Passwords hashed with **bcrypt** (12 salt rounds)
- Token sent in `Authorization: Bearer <token>` header
- Auth middleware extracts token, verifies JWT, and attaches user to `req.user`
- Default token expiry: 7 days (configurable via `JWT_EXPIRES_IN`)

## Shared Packages

### @base-mern/types

Shared TypeScript interfaces used across apps:

- `IUser` — User interface
- `UserRole` — Enum (USER, ADMIN)
- `ApiResponse<T>` — Standard API response wrapper
- `ApiErrorResponse` — Error response shape
- `PaginatedResponse<T>` — Paginated list response

### @base-mern/utils

Shared utility functions:

- `formatDate(date, locale?)` — Format a date to a human-readable string
- `formatCurrency(amount, currency?, locale?)` — Format a number as currency
- `slugify(text)` — Convert a string to a URL-friendly slug

### @base-mern/config

Shared configuration:

- ESLint flat config (TypeScript + Prettier integration)
- Prettier config
- Jest base config

## Code Quality

### Linting & Formatting

```bash
# Lint all files
npm run lint

# Format all files
npm run format

# Check formatting
npm run format:check
```

### Pre-commit Hook

Husky runs **lint-staged** on every commit, which:

- Runs ESLint with `--fix` on staged `.ts` and `.tsx` files
- Runs Prettier on staged `.ts`, `.tsx`, `.js`, `.json`, `.css`, and `.md` files

### Type Checking

```bash
npm run type-check
```

Runs `tsc --noEmit` across all three apps to catch type errors without emitting files.

## Testing

All apps use **Jest** with **ts-jest**:

```bash
# Run all tests
npm run test

# Run tests for a specific app
npm run test:api
npm run test:web
npm run test:admin
```

- **API tests** use `supertest` for HTTP assertions
- **Web/Admin tests** use `@testing-library/react` + `jest-environment-jsdom`

## Docker

### Development (docker-compose.yml)

Starts all services with hot-reload:

| Service | Image/Build | Port | Notes |
|---------|-------------|------|-------|
| mongodb | mongo:7 | 27018 | Persistent volume |
| postgres | postgres:16-alpine | 54320 | Persistent volume |
| api | apps/api/Dockerfile (dev) | 4100 | Source mounted for hot-reload |
| web | apps/web/Dockerfile (dev) | 4200 | Source mounted for hot-reload |
| admin | apps/admin/Dockerfile (dev) | 4300 | Source mounted for hot-reload |

```bash
docker compose up
```

### Production (docker-compose.prod.yml)

Uses multi-stage builds for optimized images:

- **API** — `tsc` build, runs with `node dist/index.js`
- **Web** — `next build` with standalone output
- **Admin** — `vite build`, served with nginx

```bash
# Set required env vars
export JWT_SECRET="your-production-secret"
export POSTGRES_PASSWORD="secure-password"
export MONGO_PASSWORD="secure-password"

docker compose -f docker-compose.prod.yml up --build
```

## Project Configuration

| File | Purpose |
|------|---------|
| `package.json` | Workspace root, scripts, dev dependencies |
| `tsconfig.base.json` | Shared TypeScript config (strict, ES2024) |
| `eslint.config.js` | Root ESLint config (extends @base-mern/config) |
| `prettier.config.js` | Root Prettier config (extends @base-mern/config) |
| `.lintstagedrc.json` | lint-staged config for pre-commit hook |
| `.husky/pre-commit` | Git pre-commit hook |
| `.nvmrc` | Node.js version (24.14.0) |
| `.gitignore` | Git ignore rules |
| `.dockerignore` | Docker ignore rules |

## Adding a New Module to the API

1. Create a folder under `apps/api/src/modules/<module-name>/`
2. Add controller, routes, and any models:
   - `<module>.controller.ts` — Request handlers
   - `<module>.routes.ts` — Express router with Swagger JSDoc annotations
   - Add Prisma models to `apps/api/src/prisma/schema.prisma` (for PostgreSQL)
   - Or create Mongoose models in the module folder (for MongoDB)
3. Register routes in `apps/api/src/routes/index.ts`
4. Run `npm run db:migrate` if you added Prisma models

## Adding shadcn/ui Components

Both `web` and `admin` apps are configured for shadcn/ui. To add new components:

```bash
# For the web app
cd apps/web
npx shadcn@latest add <component-name>

# For the admin app
cd apps/admin
npx shadcn@latest add <component-name>
```

Pre-installed components: **Button**, **Card**

## Ports

| Service | Port |
|---------|------|
| API | 4100 |
| Web (Next.js) | 4200 |
| Admin (Vite) | 4300 |
| PostgreSQL | 54320 |
| MongoDB | 27018 |
