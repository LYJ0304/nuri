# AGENTS.md

This file defines the working rules for coding agents in the Nuri repository. Its scope is the entire monorepo unless a more specific `AGENTS.md` exists below a directory.

## Project intent

Nuri is a document-centric application with AI-assisted processing. Keep it a modular monorepo, not a collection of premature microservices.

- Next.js is the user-facing frontend.
- NestJS is the main public API and owns the product domain.
- FastAPI is an internal AI worker only.
- PostgreSQL stores relational data.
- Redis is reserved for queues and caching.
- MinIO stores uploaded file contents through an S3-compatible API.

Prefer explicit module boundaries and simple infrastructure over additional services or abstractions.

## Repository layout

- `apps/web`: Next.js App Router application using TypeScript.
- `apps/api`: NestJS API using TypeScript and Prisma.
- `apps/ai-worker`: FastAPI worker using Python 3.12 and uv.
- `packages/contracts`: shared TypeScript API contracts validated with Zod.
- `packages/ui`: shared UI primitives.
- `packages/config`: shared TypeScript and formatting configuration.
- `infra/docker-compose.yml`: local PostgreSQL, Redis, MinIO, API, worker, and web stack.

## Architectural boundaries

### Web

- The web app calls NestJS only. Never call the FastAPI worker, PostgreSQL, Redis, or MinIO directly from browser code.
- Treat `NEXT_PUBLIC_*` values as public. Never place credentials or internal service URLs in them.
- Put contracts shared with the API in `packages/contracts`; do not duplicate request or response shapes.
- Default to Server Components. Add `'use client'` only when browser APIs, state, or effects require it.

### API

- NestJS is the system of record and the only public backend.
- Keep domain work inside the existing modules: `auth`, `users`, `organizations`, `cases`, `documents`, `ai-jobs`, and `audit-logs`.
- Add a new module only for a distinct business capability, not merely to hold a few utility functions.
- Authentication, authorization, input validation, document metadata, job creation, and audit logging belong here.
- Access PostgreSQL through Prisma. Modify `apps/api/prisma/schema.prisma` and create a migration for schema changes.
- Store file contents in MinIO and only file metadata/object keys in PostgreSQL.
- Read configuration through validated environment variables. Update `.env.example` and Compose configuration when adding required variables.

### AI worker

- The worker performs OCR, summarization, embedding, and future AI/RAG tasks. It does not own users, permissions, document metadata, or other product-domain state.
- Worker endpoints are internal. Do not expose them as frontend-facing APIs.
- The current NestJS-to-worker HTTP calls are placeholders. Prefer Redis-backed durable jobs when implementing real asynchronous processing.
- Job requests must be idempotent where practical and keyed by a NestJS-owned job identifier.
- Do not add real model providers, OCR engines, or vector stores unless the task explicitly requires them.

## Dependency and configuration rules

- Use pnpm workspaces for JavaScript and TypeScript dependencies. Do not add npm or Yarn lockfiles.
- Use uv for Python dependencies. Do not introduce Poetry or pip requirements files.
- Keep reusable runtime contracts in `packages/contracts`, UI code in `packages/ui`, and build/tooling configuration in `packages/config`.
- Avoid dependencies for functionality that can be implemented clearly with the platform or existing libraries.
- Never commit `.env`, credentials, generated build output, local databases, or object-store data.
- Keep Docker development behavior aligned with host-based development.

## Implementation conventions

- TypeScript must remain strict. Avoid `any`; validate data at external boundaries.
- Use Zod schemas for cross-package HTTP contracts.
- Use NestJS DTO validation for incoming API requests where appropriate.
- Add comments only for non-obvious constraints or design decisions.
- Do not implement speculative abstractions, generic repositories, or broad base classes.
- Preserve unrelated user changes. Do not rewrite or reformat files outside the task scope.
- Do not implement real authentication, OCR, or LLM behavior unless explicitly requested.

## Common commands

Run commands from the repository root unless noted otherwise.

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm db:migrate -- --name <migration-name>
pnpm docker:up
pnpm docker:down
```

For the Python worker:

```bash
cd apps/ai-worker
uv sync
uv run ruff check .
uv run mypy app
uv run uvicorn app.main:app --reload --port 8000
```

To validate Compose without starting services:

```bash
docker compose --env-file .env.example -f infra/docker-compose.yml config
```

## Verification expectations

Run the smallest relevant checks during development, then run all checks affected by the change before handing off.

- TypeScript or shared-package changes: `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
- Prisma changes: `pnpm --filter @nuri/api db:generate` plus an appropriate migration; do not require a destructive reset.
- Python changes: `uv run ruff check .` and `uv run mypy app` from `apps/ai-worker`.
- Compose or Dockerfile changes: validate the Compose model and build the affected service when possible.
- Contract changes: verify both the producer and every consumer.

If a check cannot run because a tool or service is unavailable, state exactly which check was skipped and why.

## Change discipline

- Keep changes minimal and production-oriented.
- Do not change public contracts silently. Update the Zod contract and all consumers together.
- Do not expose FastAPI routes, MinIO credentials, Redis, or PostgreSQL to application users.
- Do not split a NestJS module into a separate deployable service without an explicit architectural decision.
- Do not commit generated `.next`, `dist`, cache, virtual-environment, or local infrastructure data.
