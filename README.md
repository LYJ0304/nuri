# Nuri

Nuri is a modular monorepo for a document-centric application with AI-assisted processing. It is intentionally **not a full microservice architecture**: the NestJS API owns the product domain, while the separately deployable FastAPI process is a constrained internal worker for AI-heavy tasks.

## Architecture

- `apps/web`: Next.js App Router frontend. It calls only the public NestJS API.
- `apps/api`: NestJS main API for auth, users, organizations, cases, document metadata, permissions, audit logs, and AI job orchestration.
- `apps/ai-worker`: internal FastAPI worker placeholder for OCR, summarization, and embeddings. It is not a public API and must not be called by the frontend.
- `packages/contracts`: shared runtime-validated TypeScript contracts.
- `packages/ui`: shared UI primitives placeholder.
- `packages/config`: shared repository configuration.
- PostgreSQL stores relational state, Redis backs queues, and MinIO provides local S3-compatible object storage.

The API-to-worker boundary currently exposes internal HTTP placeholders. Redis is provisioned so this boundary can move to durable queued jobs without splitting the core domain into premature services.

## Local setup

Prerequisites: Node.js 22+, pnpm 10+, Python 3.12 with [uv](https://docs.astral.sh/uv/), and Docker with Compose.

```bash
cp .env.example .env
pnpm install
(cd apps/ai-worker && uv sync)
pnpm docker:up
```

For host-based development, start infrastructure only if preferred, then run `pnpm dev` and separately run the worker:

```bash
cd apps/ai-worker
uv run uvicorn app.main:app --reload --port 8000
```

Initialize the database after PostgreSQL is running:

```bash
pnpm db:migrate -- --name init
```

## Commands

- `pnpm dev` — run TypeScript apps in watch mode
- `pnpm build` — build all TypeScript workspaces
- `pnpm lint` — lint/check TypeScript workspaces
- `pnpm typecheck` — type-check TypeScript workspaces
- `pnpm db:migrate` — run Prisma development migrations
- `pnpm docker:up` / `pnpm docker:down` — start or stop the complete local stack

Python checks are run from `apps/ai-worker` with `uv run ruff check .` and `uv run mypy app`.

## Service URLs

| Service | URL |
| --- | --- |
| Web | http://localhost:3000 |
| API health | http://localhost:3001/health |
| AI worker health | http://localhost:8000/health |
| AI worker internal docs | http://localhost:8000/internal/docs |
| MinIO API | http://localhost:9000 |
| MinIO console | http://localhost:9001 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

Do not expose the FastAPI worker publicly in production. Authentication, authorization, validation, persistence, and job creation belong in NestJS.
