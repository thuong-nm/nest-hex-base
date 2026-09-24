# nest-hexa-base

A project-agnostic NestJS boilerplate: a modular monolith where each business module is a
hexagon (ports & adapters). It includes authentication with rotating refresh tokens,
USER/ADMIN authorization, translated API responses, and architecture rules that are enforced
by tooling.

Architecture, conventions and step-by-step recipes are in **[AGENTS.md](AGENTS.md)**. Read it
before changing code; it applies to humans too.

## Stack

| Area               | Choice                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| Runtime / language | Node 22, TypeScript (strict), ESM                                                              |
| Framework          | NestJS 12 (Express), `@nestjs/cqrs` for domain events                                          |
| Database           | PostgreSQL + Prisma 7 (`@prisma/adapter-pg`)                                                   |
| Config             | `@nestjs/config` + Zod: the app refuses to start on invalid env                                |
| Logging            | `nestjs-pino`, request id via `X-Request-Id`                                                   |
| i18n               | `nestjs-i18n`: `lang` header → `Accept-Language` → `DEFAULT_LANG`                              |
| Auth               | `@nestjs/jwt` access tokens, opaque rotating refresh tokens, argon2                            |
| API                | URI versioning (`/api/v1`), Swagger at `/docs`, Helmet, CORS, `@nestjs/throttler`              |
| Health             | `@nestjs/terminus` at `/health`                                                                |
| Quality            | Vitest, Testcontainers, oxlint (type-aware), Prettier, dependency-cruiser, Husky + lint-staged |
| Scaffolding        | plop (`pnpm gen:module`)                                                                       |

## Getting started

Prerequisites: Node 22+, pnpm 12, and Docker (for the local database and e2e tests).

```bash
pnpm install                 # also generates the Prisma client
cp .env.example .env         # then set JWT_ACCESS_SECRET, ADMIN_* etc.
docker compose up -d         # Postgres on localhost:${POSTGRES_PORT:-55432}
pnpm db:migrate              # apply migrations
pnpm seed:admin              # create the first admin from ADMIN_EMAIL / ADMIN_PASSWORD
pnpm dev                     # http://localhost:8000/api/v1, Swagger at http://localhost:8000/docs
```

## Scripts

| Script                               | What it does                                                                                                      |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                           | Start in watch mode                                                                                               |
| `pnpm build` / `pnpm start`          | Compile to `dist/` / run the compiled app                                                                         |
| `pnpm typecheck`                     | Check that typed i18n keys are up to date, then `tsc --noEmit`                                                    |
| `pnpm lint`                          | oxlint (type-aware), warnings fail                                                                                |
| `pnpm lint:arch`                     | dependency-cruiser layer rules + table-ownership check                                                            |
| `pnpm format` / `pnpm format:check`  | Prettier                                                                                                          |
| `pnpm test`                          | Unit tests (use cases with in-memory fakes, i18n guards)                                                          |
| `pnpm test:e2e`                      | End-to-end tests against a throwaway Postgres container (needs Docker)                                            |
| `pnpm db:generate`                   | Regenerate the Prisma client                                                                                      |
| `pnpm db:migrate`                    | Create/apply a migration in development (`prisma migrate dev`)                                                    |
| `pnpm db:migrate:deploy`             | Apply pending migrations (production)                                                                             |
| `pnpm db:seed`                       | Run all seeders (currently: the admin seed)                                                                       |
| `pnpm seed:admin`                    | Create or promote the admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Idempotent; never changes an existing password |
| `pnpm i18n:types`                    | Regenerate `src/generated/i18n.generated.ts` after editing translations                                           |
| `pnpm gen:module <context> [entity]` | Scaffold a bounded context, e.g. `pnpm gen:module orders order`                                                   |

Git hooks:

- `pre-commit` runs lint-staged (oxlint + Prettier on staged files).
- `pre-push` runs typecheck, lint, lint:arch and test. There is no CI yet, so this hook is the gate.

## Environment variables

| Variable                         | Default        | Notes                                                                                                          |
| -------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                       | `development`  | `development` \| `test` \| `production`. `development` enables pretty logs and translation hot reload          |
| `PORT`                           | `8000`         |                                                                                                                |
| `LOG_LEVEL`                      | `info`         | pino level (`fatal` … `trace`, `silent`)                                                                       |
| `CORS_ORIGINS`                   | `*`            | Comma-separated origins, or `*` (credentials are disabled with `*`)                                            |
| `SWAGGER_ENABLED`                | `true`         | Serves `/docs` and `/docs/json`. Also relaxes Helmet's CSP so the UI can load; disable in production if unused |
| `DATABASE_URL`                   | required       | `postgresql://…`                                                                                               |
| `POSTGRES_PORT`                  | `55432`        | Host port used by `docker-compose.yml` only; keep in sync with `DATABASE_URL`                                  |
| `DEFAULT_LANG`                   | `en`           | Fallback language when the request names no supported one; always added to `SUPPORTED_LANGS`                   |
| `SUPPORTED_LANGS`                | `DEFAULT_LANG` | Comma-separated. Each must have a `src/i18n/<lang>/` folder, or startup fails                                  |
| `JWT_ACCESS_SECRET`              | required       | At least 32 characters (`openssl rand -base64 48`)                                                             |
| `JWT_ACCESS_TTL_SECONDS`         | `900`          | Access tokens are not revocable, so keep this short                                                            |
| `REFRESH_TOKEN_TTL_SECONDS`      | `2592000`      | 30 days                                                                                                        |
| `AUTH_THROTTLE_TTL_MS`           | `60000`        | Rate-limit window for `/auth/*`                                                                                |
| `AUTH_THROTTLE_LIMIT`            | `10`           | Requests per window per client IP for `/auth/*`                                                                |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | –              | Only read by `pnpm seed:admin` (password ≥ 8 chars)                                                            |

## API at a glance

All endpoints are under `/api/v1`, except `/health` and `/docs`. Every response uses one envelope:

```jsonc
// success
{ "success": true, "data": {}, "message": "Login successful",
  "meta": { "requestId": "…", "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 } } }
// error: `code` is stable, `message` is translated
{ "success": false,
  "error": { "code": "COMMON.VALIDATION_FAILED", "message": "The submitted data is invalid",
             "details": [{ "field": "email", "code": "VALIDATION.IS_EMAIL", "message": "email must be a valid email address" }] },
  "meta": { "requestId": "…" } }
```

| Method | Path                                         | Access                                                                 |
| ------ | -------------------------------------------- | ---------------------------------------------------------------------- |
| POST   | `/auth/register`                             | public (always creates a `USER`)                                       |
| POST   | `/auth/login`                                | public                                                                 |
| POST   | `/auth/refresh`                              | public (refresh token in body; single use)                             |
| POST   | `/auth/logout`                               | public (revokes the given refresh token)                               |
| GET    | `/auth/me`                                   | authenticated                                                          |
| GET    | `/admin/users?page&limit&role&status&search` | `ADMIN`                                                                |
| PATCH  | `/admin/users/:id/role`                      | `ADMIN` (not on yourself)                                              |
| PATCH  | `/admin/users/:id/status`                    | `ADMIN` (not on yourself; disabling revokes the user's refresh tokens) |
| GET    | `/health`                                    | public                                                                 |

To get a translated response, send `lang: vi` (or `Accept-Language`). The resolved language is
returned in `Content-Language`.

## Production notes

- Build the image with `docker build -t app .` and run it with `docker run --env-file .env -p 8000:8000 app`.
- Run migrations before starting new code with `pnpm db:migrate:deploy`. The runtime image contains production dependencies only, so run migrations from a build/CI step or a separate job.
- Seed the admin in the image with `node dist/seeds/seed-admin.js`.
- Behind a load balancer, configure Express `trust proxy` in `src/shared/infrastructure/http/configure-app.ts`. Otherwise the throttler sees the proxy IP.
- Domain events are delivered in-process after commit, with no outbox. If you need guaranteed delivery, replace `CqrsDomainEventPublisher` with an outbox adapter.
