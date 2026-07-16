---
name: nestjs-patterns
description: NestJS module, controller, provider, DTO, Prisma, authorization, and configuration patterns for Nuri's apps/api service.
metadata:
  origin: ECC
  adapted-for: nuri
---

# NestJS Patterns

Use this skill for work in `apps/api`. Follow the root `AGENTS.md` first.

## Modules and Ownership

- Keep domain work in the existing `auth`, `users`, `organizations`, `cases`, `documents`, `ai-jobs`, and `audit-logs` modules.
- Add a module only for a distinct business capability, not as a utility container.
- Keep controllers thin: translate HTTP input, call an injectable provider, and return the declared response.
- Put business rules and multi-step workflows in the service that owns the domain operation.
- Export only providers that another module genuinely needs.

## DTOs and Contracts

- Validate request DTOs with `class-validator`/`class-transformer` where appropriate.
- Preserve strict TypeScript types and avoid `any`.
- Use explicit response mapping rather than returning Prisma records blindly.
- Keep cross-package wire contracts in `packages/contracts`; update all consumers with contract changes.
- Keep the global validation policy consistent with the application bootstrap.

## Authorization and Errors

- Use guards for authentication and coarse access rules.
- Enforce organization membership and resource-specific authorization in domain services before reads or writes.
- Throw NestJS HTTP exceptions for expected client errors and handle unexpected errors centrally.
- Keep error bodies stable and never leak hashes, tokens, stack traces, object-store credentials, or internal worker details.

## Prisma and Transactions

- Access PostgreSQL through Prisma only.
- Select only required fields, include relations deliberately, and avoid N+1 queries.
- Use a Prisma transaction when writes must succeed or fail as one unit.
- Keep transaction boundaries in the service that owns the workflow; controllers must not coordinate multi-step writes.
- For schema changes, update `apps/api/prisma/schema.prisma`, create a named migration, and regenerate the client without destructive resets.
- Store MinIO object keys and metadata in PostgreSQL, never uploaded file contents.

## Configuration and Integrations

- Read configuration through validated environment variables and fail fast when required values are invalid.
- Update `.env.example`, Compose, and relevant docs when a required variable changes.
- Keep FastAPI calls internal and keyed by a NestJS-owned job identifier.
- Prefer durable Redis jobs when implementing real asynchronous processing.
- Keep audit logging explicit for security- and domain-significant actions.

## Verification

Run focused checks during development and the affected API checks before handoff:

```bash
pnpm --filter @nuri/api lint
pnpm --filter @nuri/api typecheck
pnpm --filter @nuri/api build
```

For Prisma changes also run:

```bash
pnpm --filter @nuri/api db:generate
pnpm db:migrate -- --name <migration-name>
```
