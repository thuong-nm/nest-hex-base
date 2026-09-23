# AGENTS.md

Single source of truth for any AI agent changing this repository. Read it fully before every
task. If the code and this file disagree, stop and report it; do not silently pick one.

## 1. Project overview

- NestJS 12 modular monolith: each business module (bounded context) is a hexagon (ports & adapters).
- Shared technical infrastructure: Zod-validated config, Prisma/PostgreSQL, pino logging with request ids, i18n, HTTP cross-cutting (envelope, errors, guards).
- Auth: register / login / rotating refresh tokens with reuse detection / logout / me; JWT access tokens; argon2 passwords.
- Authorization: `USER` / `ADMIN` roles, `ACTIVE` / `DISABLED` status, admin endpoints under `/api/v1/admin/...`.
- Every response is a translated envelope (`lang` header); architecture rules are enforced by `pnpm lint:arch`.

## 2. Before you start any task

1. Read this file.
2. Read `src/modules/*/index.ts` to see which facades already exist. Reuse them; do not duplicate logic another module owns.
3. Copy the patterns in `src/modules/users` and `src/modules/auth` (the reference implementation).
4. Never add a dependency without stating, in your reply, why it is needed and why existing dependencies are not enough.
5. Verify library APIs against the installed version (`node_modules/<pkg>`) or current docs. Do not guess.

## 3. Architecture

### Layers and dependency direction

```
            ┌──────────────────────────────────────────────┐
 HTTP/events│ interface/   controllers, request/response    │  driving adapters
            │              DTOs, event handlers            │
            └──────────────────────┬───────────────────────┘
                                   ▼
            ┌──────────────────────────────────────────────┐
            │ application/ use cases, ports (interfaces +   │
            │              Symbol tokens), commands/results │
            └──────────────────────┬───────────────────────┘
                                   ▼
            ┌──────────────────────────────────────────────┐
            │ domain/      entities, value objects, events, │
            │              error codes (pure TypeScript)    │
            └──────────────────────────────────────────────┘
                                   ▲ implements application ports
            ┌──────────────────────┴───────────────────────┐
            │ infrastructure/ Prisma repositories, mappers, │  driven adapters
            │                 vendor adapters               │
            └──────────────────────────────────────────────┘
```

- Dependencies point inward: `interface → application → domain`. `infrastructure` implements ports declared in `application`.
- `<context>.module.ts` is the composition root of a module: the only file that binds ports to adapters.
- `shared/kernel` is pure TypeScript usable by every layer. `shared/infrastructure` is framework code, not a hexagon, and never imports a module.

### Repository structure

```
src/
├─ main.ts                          # bootstrap: NestFactory + configureApp()
├─ app.module.ts                    # imports InfrastructureModule + every bounded context
├─ generated/
│  ├─ prisma/                       # Prisma client (gitignored, `pnpm db:generate`)
│  └─ i18n.generated.ts             # typed i18n keys (committed, `pnpm i18n:types`)
├─ seeds/seed-admin.ts              # `pnpm seed:admin`
├─ shared/
│  ├─ kernel/                       # pure TS, no framework imports
│  │  ├─ domain/                    # entity.base, aggregate-root.base, value-object.base, domain-event.base
│  │  ├─ errors/                    # domain.error.ts, error-codes.ts (COMMON.*)
│  │  ├─ result.ts                  # Result<T, E>, ok, err, unwrap
│  │  └─ ports/                     # clock, id-generator, domain-event-publisher, transaction-runner
│  └─ infrastructure/
│     ├─ infrastructure.module.ts   # imports everything below; imported once by AppModule
│     ├─ config/                    # env.schema.ts (Zod, fail fast), AppConfigService
│     ├─ database/                  # PrismaService, PrismaTransactionHost (ambient tx), prisma-errors
│     ├─ logger/                    # nestjs-pino, X-Request-Id
│     ├─ i18n/                      # nestjs-i18n setup, LangResolver, error-code → key, TranslatorService
│     ├─ http/
│     │  ├─ http.module.ts          # registers filter, interceptor, guards, validation pipe, JWT, throttler
│     │  ├─ configure-app.ts        # helmet, CORS, /api prefix, URI versioning, Swagger
│     │  ├─ auth-context.ts         # AccessTokenClaims, AuthenticatedUser
│     │  ├─ filters/                # AllExceptionsFilter (domain + HTTP + validation errors)
│     │  ├─ interceptors/           # ResponseEnvelopeInterceptor (+ Content-Language)
│     │  ├─ guards/                 # JwtAuthGuard (global), RolesGuard (global)
│     │  ├─ decorators/             # @Public(), @Roles(), @CurrentUser(), @ResponseMessage()
│     │  ├─ errors/                 # AppHttpException, RequestValidationException
│     │  ├─ dto/                    # PaginationQueryDto, PaginatedResponse
│     │  └─ swagger/                # @ApiEnvelopeResponse(), @ApiErrorResponses(), global `lang` header
│     ├─ health/                    # GET /health (Terminus, DB ping)
│     ├─ di/provide-use-case.ts     # factory provider for decorator-free use cases
│     └─ adapters/                  # SystemClock, UuidGenerator, CqrsDomainEventPublisher
├─ i18n/
│  ├─ en/  common.json  validation.json  auth.json  users.json
│  └─ vi/  common.json  validation.json  auth.json  users.json
└─ modules/
   ├─ users/                        # bounded context (reference)
   └─ auth/                         # bounded context (reference)
prisma/  schema.prisma  migrations/  ownership.json (model → owning module)
scripts/ check-table-ownership.ts  check-test-layout.ts  gen-i18n-types.ts
test/    modules/  shared/           # unit specs, mirroring src/ paths
         fakes/  i18n/  e2e/
plopfile.js  plop-templates/module/   # `pnpm gen:module`
```

### Bounded context structure (every business module MUST follow this)

```
src/modules/<context>/
├─ domain/
│  ├─ entities/        <name>.entity.ts
│  ├─ value-objects/   <name>.vo.ts
│  ├─ events/          <name>.event.ts
│  └─ errors/          <context>.errors.ts     # <Context>ErrorCode + <Context>Errors factories
├─ application/
│  ├─ ports/           <name>.port.ts          # interface + Symbol token
│  ├─ use-cases/       <verb-noun>.use-case.ts (spec in test/modules/<context>/application/use-cases/)
│  ├─ services/        <name>.ts               # optional: logic shared by several use cases
│  └─ dto/             <name>.command.ts / <name>.result.ts   # plain types, no decorators
├─ infrastructure/
│  ├─ persistence/     prisma-<name>.repository.ts, <name>.mapper.ts
│  └─ adapters/        <vendor>-<name>.adapter.ts
├─ interface/
│  ├─ http/
│  │  ├─ <name>.controller.ts
│  │  ├─ admin-<name>.controller.ts   # admin-only endpoints, separate controller
│  │  └─ dto/          <name>.request.dto.ts, <name>.response.dto.ts  # class-validator + swagger
│  └─ events/          <event-name>.handler.ts  # @EventsHandler: reacts to other modules' events
├─ <context>.facade.ts # optional: public API for other modules (@Injectable, delegates to use cases)
├─ <context>.module.ts # ONLY place that binds ports to adapters
└─ index.ts            # public facade; the ONLY file other modules may import
```

Empty folders keep a `.gitkeep`.

## 4. Hard rules

1. `domain/` imports nothing except `shared/kernel`. No @nestjs/*, Prisma, i18n or SDKs.
2. `application/` imports only its own `domain/`, its `ports/`, and `shared/kernel`.
3. Ports are interfaces plus a `Symbol` injection token, named by business need, never by vendor.
4. Prisma models are never returned from repositories. Always map to domain entities via `<name>.mapper.ts`.
5. Cross-module calls: the consumer defines its own port; its adapter calls the provider's facade exported from `index.ts`. Never import another module's internals.
6. Async cross-module communication uses domain events via `@nestjs/cqrs` EventBus.
7. A module reads and writes only its own tables.
8. Enforce rules 1–7 with dependency-cruiser; `pnpm lint:arch` must fail on violations and run in CI.

How they are enforced here:

- Rules 1, 2, 4 and 5 are checked by `.dependency-cruiser.cjs`. The same config also enforces: `shared/` never imports `modules/`; only `<context>.module.ts` imports the module's own adapters; nothing imports `interface/`; there are no cycles; production code never imports devDependencies or `test/`.
- Rule 2 clarification: `application/` may import any file in its own `application/` folder (ports, dto, services).
- Rule 5 clarification: another module's `index.ts` may be imported only from the consumer's `infrastructure/`, `interface/events/` (to subscribe to the provider's event classes), and `<context>.module.ts` (to import the provider's Nest module).
- Rule 6: publish through the `DOMAIN_EVENT_PUBLISHER` kernel port. Handle events in `interface/events/*.handler.ts`, which calls a use case.
- Rule 7: every Prisma model is assigned to one module in `prisma/ownership.json`. `scripts/check-table-ownership.ts` (part of `lint:arch`) fails when a module touches a model it does not own, or when a model has no owner. Never add a Prisma `@relation` across modules: store the other module's id as a plain column.
- Rule 8: **this repository has no CI yet.** `lint:arch` runs in the Husky `pre-push` hook together with typecheck, lint and test. When CI is added, it must run `pnpm typecheck && pnpm lint && pnpm lint:arch && pnpm test && pnpm test:e2e`.

## 5. Naming conventions

| Thing                  | File                                                 | Class / symbol                                                           |
| ---------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------ |
| Entity / aggregate     | `user.entity.ts`                                     | `User` (extends `AggregateRoot` or `Entity`)                             |
| Value object           | `email.vo.ts`                                        | `Email` (extends `ValueObject`); enums as `const` object + type (`Role`) |
| Domain event           | `user-status-changed.event.ts`                       | `UserStatusChangedEvent` (extends `DomainEvent`)                         |
| Errors                 | `users.errors.ts`                                    | `UsersErrorCode` (codes) + `UsersErrors` (factories)                     |
| Port                   | `user.repository.port.ts`, `password-hasher.port.ts` | `UserRepository` + `USER_REPOSITORY = Symbol('USER_REPOSITORY')`         |
| Use case               | `change-user-role.use-case.ts`                       | `ChangeUserRoleUseCase` with a single `execute()`                        |
| Command / result       | `change-user-role.command.ts`, `user.result.ts`      | `ChangeUserRoleCommand`, `UserResult`                                    |
| Repository             | `prisma-user.repository.ts`                          | `PrismaUserRepository`                                                   |
| Mapper                 | `user.mapper.ts`                                     | `UserMapper.toDomain()` / `.toPersistence()`                             |
| Adapter                | `argon2-password-hasher.adapter.ts`                  | `Argon2PasswordHasher` (vendor first)                                    |
| Controller             | `auth.controller.ts`, `admin-users.controller.ts`    | `AuthController`, `AdminUsersController`                                 |
| Request / response DTO | `login.request.dto.ts`, `user.response.dto.ts`       | `LoginRequestDto`, `UserResponseDto`                                     |
| Event handler          | `user-status-changed.handler.ts`                     | `UserStatusChangedHandler`                                               |
| Facade                 | `users.facade.ts`                                    | `UsersFacade`                                                            |

- Symbol tokens: `SCREAMING_SNAKE` of the port name: `USER_REPOSITORY`, `TOKEN_SERVICE`, `USER_ACCOUNT`.
- Error codes: `<CONTEXT>.<SCREAMING_SNAKE>`. `<CONTEXT>` is the module folder name in `SCREAMING_SNAKE` (`order-items` → `ORDER_ITEMS`), e.g. `USERS.EMAIL_TAKEN`, `AUTH.INVALID_CREDENTIALS`. Shared codes are `COMMON.*` (`shared/kernel/errors/error-codes.ts`).
- i18n keys:
  - The namespace is the file name, which is the module folder name (`users.json` → `users.`).
  - Success messages use `<namespace>.<SCREAMING_SNAKE>`, e.g. `auth.LOGIN_SUCCESS`.
  - Error messages use `<namespace>.errors.<CODE_SUFFIX>`: `AUTH.INVALID_CREDENTIALS` → `auth.errors.INVALID_CREDENTIALS`, and `ORDER_ITEMS.X` → `order-items.errors.X`.
  - Validation messages use `validation.<SCREAMING_SNAKE>`. The response `code` is `VALIDATION.<SAME>`.
- Routes:
  - Controllers declare paths without prefix or version (`@Controller('admin/users')`); `/api/v1` is added globally.
  - Admin controllers use `admin/<resource>`.
- Imports:
  - Relative paths and two aliases are allowed: `#src/*` (maps to `src/*`) and `#test/*` (maps to `test/*`), e.g. `import { CLOCK } from '#src/shared/kernel/ports/clock.port.js'`. Keep the `.js` extension either way.
  - Use `#src/...` whenever an import leaves the importing module (`shared/`, `generated/`, another module's `index.ts`), from `test/` into `src/`, and elsewhere in `src/` when a relative path would climb two or more levels. Use `#test/...` in `test/` when a relative path to another `test/` file would climb two or more levels (e.g. `#test/fakes/fixed-clock.js`). Keep relative imports inside a module.
  - `src/` never imports `test/` (enforced by the `not-to-test` rule); `#test/*` has no `dist/` target because `test/` is not built.
  - `#src/*` is a Node subpath import (`package.json` `"imports"`): the `development` condition points to `src/`, `default` to `dist/`. Every tool that reads `src/` must enable that condition: it is set in `tsconfig.json` (`customConditions`), both Vitest configs (`ssr.resolve.conditions`), `.dependency-cruiser.cjs` (`conditionNames`), and `tsx --conditions=development`. Without it the alias silently resolves to stale `dist/` code.
  - Do not add an `@/...` alias: Node requires subpath imports to start with `#`, so `@/` would only work through tsconfig `paths` plus build-time rewriting, i.e. a second alias mechanism.

## 6. Recipes

### Add a new bounded context

1. `pnpm gen:module <context> [entity]`, e.g. `pnpm gen:module orders order`. Both names are kebab-case: context plural, entity singular. The generator:
   - creates the full folder tree, the module file, `index.ts`, an example aggregate, and create/get use cases, with unit tests in `test/modules/<context>/`
   - creates an in-memory fake repository and an i18n namespace in every locale
   - appends a Prisma model and its owner to `prisma/ownership.json`
   - registers the module in `app.module.ts` and regenerates the Prisma client and i18n types
2. `pnpm db:migrate --name add-<context>`.
3. Translate `src/i18n/<lang>/<context>.json` for every non-English locale (they are seeded with English).
4. Replace the example `name` field with the real model (entity, mapper, Prisma model, DTOs, tests).
5. Run the Definition of Done checks (§10).

### Add a new endpoint

1. Request DTO in `interface/http/dto/<name>.request.dto.ts`:
   - class-validator decorators, each with `message: i18nValidationMessage<I18nTranslations>('validation.X')`
   - `@ApiProperty` on every field
2. Command/result types in `application/dto/`.
3. Use case in `application/use-cases/<verb-noun>.use-case.ts`:
   - a plain class with constructor-injected ports
   - throws `DomainError`s built from `<context>.errors.ts`
4. If it needs something new from the outside world, add a port (see the next recipe).
5. Register the use case in `<context>.module.ts` with `provideUseCase(UseCase, [TOKENS...])`, listing tokens in constructor order.
6. Controller method:
   - calls the use case and maps the result with `<Name>ResponseDto.from(...)`
   - add `@ResponseMessage('<ns>.KEY')`, `@ApiEnvelopeResponse(Dto, {...})` and `@ApiErrorResponses(...)`
   - use `@Public()` only for anonymous routes, and `@HttpCode(200)` for non-creating POSTs
7. Add the new i18n keys (success message, error codes) to **every** locale, then run `pnpm i18n:types`.
8. Add a unit test for the use case with in-memory fakes, at the mirrored path under `test/modules/<context>/`, and an e2e test in `test/e2e/`.
9. Check `/docs` (Swagger) shows the endpoint correctly.

### Add a new outbound integration (email, payments, storage, ...)

1. Define the port in `application/ports/<need>.port.ts` (interface + Symbol), named by business need, e.g. `NotificationSender`, not `SendgridClient`.
2. Implement it in `infrastructure/adapters/<vendor>-<need>.adapter.ts`. Read credentials via `AppConfigService`, and add the variables to `env.schema.ts` and `.env.example`.
3. Bind it in `<context>.module.ts`: `{ provide: NOTIFICATION_SENDER, useClass: SendgridNotificationSender }`.
4. Add a fake in `test/fakes/<context>/` and use it in unit tests.

### Call another module

1. In the consumer, declare a port for exactly what it needs, e.g. `auth/application/ports/user-account.port.ts`.
2. If the provider has no facade method for it:
   - add one in `<provider>.facade.ts`, delegating to a provider use case
   - export any public types from the provider's `index.ts`
   - export the facade from the provider module (`exports: [...]`)
3. In the consumer, write an adapter, e.g. `infrastructure/adapters/<provider>-facade-<need>.adapter.ts`:
   - it imports only the provider's `index.js` (`#src/modules/<provider>/index.js` or `../../../<provider>/index.js`)
   - it maps the provider's types to the consumer's port types
4. In `<consumer>.module.ts`, import the provider's Nest module and bind the port to the adapter.
5. For fire-and-forget reactions, use events instead:
   - export the event class from the provider's `index.ts`
   - handle it in the consumer's `interface/events/<event>.handler.ts`
   - register the handler in the consumer module's `providers`

### Add a translation / a new language

- **New key:** add it to the same file in every `src/i18n/<lang>/` folder, run `pnpm i18n:types`, and commit `src/generated/i18n.generated.ts`. The locale-completeness test fails on any mismatch.
- **New language `xx`:**
  1. Copy `src/i18n/en/` to `src/i18n/xx/` and translate every value.
  2. Add `xx` to `SUPPORTED_LANGS` in `.env.example` and in each environment.
  3. Startup fails if `SUPPORTED_LANGS` lists a language that has no folder.

### Add an admin-only endpoint

1. Put it in `interface/http/admin-<resource>.controller.ts`, with `@Controller('admin/<resource>')`, `@Roles(Role.ADMIN)`, `@ApiBearerAuth()`, and `@ApiErrorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN)`.
2. Pass the acting admin as `@CurrentUser() actor` into the command (`actorId`). Enforce "cannot act on yourself" rules in the domain.
3. Add an e2e test proving a `USER` gets 403.

## 7. i18n rules

- No hardcoded user-facing strings anywhere: not in controllers, use cases, domain, guards, or filters.
- Domain and application code throw `DomainError(code, { kind, params })` and never produce messages. The filter translates the code; `params` are interpolation args (`{name}` in the translation).
- Success messages come only from `@ResponseMessage('<ns>.KEY')`. The default is `common.SUCCESS`.
- Every validation decorator uses `i18nValidationMessage<I18nTranslations>('validation.KEY')`. Built-in class-validator errors without a message fall back to `validation.<CONSTRAINT_NAME>` (e.g. `WHITELIST_VALIDATION`).
- Every new key goes into every locale in the same commit. Keys are typed: a missing or misspelled key fails `pnpm typecheck`.
- Language resolution:
  - order: the `lang` header, then `Accept-Language`, then `en`
  - normalized (`en-US` → `en`) and limited to `SUPPORTED_LANGS`
  - the result is echoed in `Content-Language`
- The resolver lives in `shared/infrastructure/i18n/lang.resolver.ts`. The `lang` header is documented globally in Swagger.

## 8. Error handling rules

- Domain and application layers: throw `DomainError` only, created through the module's `<Context>Errors` factories. Pick `kind`: `VALIDATION` 400, `UNAUTHORIZED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT` 409, `BUSINESS_RULE` 422.
- Infrastructure adapters translate vendor errors into `DomainError`s when they have domain meaning. For example, a Prisma unique violation becomes `USERS.EMAIL_TAKEN` (use `isUniqueViolation`). Let anything else bubble up: it becomes a logged 500 `COMMON.INTERNAL_ERROR`.
- HTTP exceptions (`@nestjs/common` exceptions, `AppHttpException`) are allowed only in `interface/` and `shared/infrastructure/http`, for transport-level failures.
- Never build error responses by hand. `AllExceptionsFilter` produces the error envelope for every thrown value:
  ```json
  { "success": false, "error": { "code": "...", "message": "...", "details": [{ "field", "code", "message" }] }, "meta": { "requestId": "..." } }
  ```
- Never catch an error only to ignore it. If you catch, either rethrow, map it to a `DomainError`, or log it with context and rethrow.

## 9. Security rules

- Response DTOs list their fields explicitly and are built with a static `from()`. Never spread entities or results into responses. Never return password hashes.
- Tokens appear only in `SessionResponseDto` (login and refresh).
- Never accept `role`, `status`, `userId` or ownership from the request body to decide authorization. Use `@CurrentUser()`, which is always derived from the verified JWT.
- Every route requires a valid access token unless it is explicitly marked `@Public()`. Admin routes add `@Roles(Role.ADMIN)`.
- Registration can never set a role. Unknown body fields are rejected (`forbidNonWhitelisted`).
- Login failures return `AUTH.INVALID_CREDENTIALS` for both unknown email and wrong password. Keep the timing equal too: `PasswordHasher.verify(null, ...)` hashes against a dummy.
- Refresh tokens:
  - opaque, stored only as SHA-256 hashes
  - single use: rotation revokes the old token atomically
  - presenting a revoked token revokes its whole family
- Access tokens are short-lived and are not revoked on logout or disable. Keep `JWT_ACCESS_TTL_SECONDS` small.
- Disabling a user revokes all their refresh tokens (via `UserStatusChangedEvent`).
- Secrets come only from env (`env.schema.ts`). Never log secrets: pino redacts `authorization`, `cookie`, `password`, `refreshToken` and `accessToken`. Extend the redaction list when you add new secret fields.
- Auth routes are rate limited (`ThrottlerGuard`, `AUTH_THROTTLE_*`). Apply the guard to any other abuse-prone controller.

## 10. Testing rules and Definition of Done

Testing rules:

- Unit specs live under `test/` at the same path as the file they cover, with `.spec.ts` instead of `.ts`:
  `src/modules/users/domain/events/user-registered.event.ts` → `test/modules/users/domain/events/user-registered.event.spec.ts`.
  Never put a `.spec.ts` inside `src/`. `scripts/check-test-layout.ts` (part of `lint:arch`) fails on a spec in `src/` or a mirrored spec with no source file.
- Every use case has a unit test (`test/modules/<context>/application/use-cases/<name>.use-case.spec.ts`).
  - Construct the use case with `new` and in-memory fakes from `test/fakes/`.
  - Never use the Nest testing module for domain or application code.
- Fakes store snapshots, not live references, like a real database.
- Put new fakes in `test/fakes/<context>/`.
- e2e tests (`test/e2e/*.e2e-spec.ts`):
  - they boot the real `AppModule` with `configureApp()` against a Testcontainers Postgres, which needs Docker
  - use `createTestApp()` and call `reset()` in `beforeEach`
- Guard tests that must keep passing:
  - `test/i18n/locale-completeness.spec.ts`: identical keys in all locales, no empty values
  - `test/i18n/error-codes-translated.spec.ts`: every declared error code is well-formed and translated

Definition of Done (all must hold):

- [ ] `pnpm typecheck && pnpm lint && pnpm lint:arch && pnpm test` pass (and `pnpm test:e2e` when HTTP behavior changed).
- [ ] New or changed i18n keys exist in **all** locales; `src/generated/i18n.generated.ts` is regenerated.
- [ ] Swagger is updated: DTO `@ApiProperty`, `@ApiEnvelopeResponse`, `@ApiErrorResponses` and `@ApiBearerAuth` where needed.
- [ ] Schema changes have a migration (`pnpm db:migrate --name <change>`), and new models have an owner in `prisma/ownership.json`.
- [ ] New env variables are in `env.schema.ts`, `.env.example` and README.
- [ ] No `TODO` without an explanation of what is missing and why.
- [ ] This file is updated if you changed a convention, a rule or the structure.

## 11. Forbidden

- Prisma (client, `PrismaService`, generated types) anywhere outside `infrastructure/persistence/` and `shared/infrastructure/database/`.
- Business logic in controllers. Controllers only map DTO → command → use case → response DTO.
- Importing another module's files other than its `index.ts`, or importing a facade from that module's domain, application or HTTP layer.
- Returning Prisma models or domain entities from controllers or facades.
- Nest decorators (`@Injectable`, `@Inject`) in `domain/` or `application/`. Register use cases with `provideUseCase`.
- `any`, `as any`, `@ts-ignore`, and non-null assertions to silence real type errors.
- Catching and swallowing errors, or empty `catch` blocks.
- String messages in the domain or application layer (`throw new Error('User not found')`). Throw `DomainError` with a code.
- Hardcoded user-facing text, or a locale missing a key.
- Cross-module Prisma relations, or touching another module's tables.
- Editing generated files (`src/generated/**`) by hand, or editing an applied migration.

## 12. Reference implementation

- `src/modules/users`: aggregate with invariants and events (`User`), value objects (`Email`, `Role`, `UserStatus`), repository port + Prisma repository + mapper, vendor adapter (`Argon2PasswordHasher`), admin controller with pagination, public facade (`UsersFacade`).
- `src/modules/auth`:
  - a consumer-side port over another module (`UserAccountPort` → `UsersFacadeUserAccountAdapter`)
  - a transactional use case (`RefreshSessionUseCase`) and a shared application service (`SessionIssuer`)
  - an event handler reacting to another module (`interface/events/user-status-changed.handler.ts`)
  - public and authenticated routes, and throttling

When in doubt, copy what these modules do.
