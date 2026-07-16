---
name: verification-loop
description: Repository-aware verification workflow for Nuri changes. Use after implementation, before handoff, and before publishing changes.
metadata:
  origin: ECC
  adapted-for: nuri
---

# Verification Loop

Verify the changed surface, not an imagined universal checklist. The root `AGENTS.md` defines the required gates.

## 1. Establish Scope

```bash
git status --short
git diff --check
git diff --stat
git diff
```

- Separate task changes from pre-existing user changes.
- Review every changed file for accidental edits, secrets, generated output, and contract drift.

## 2. Run Focused Checks

During implementation, run the narrowest available lint, typecheck, test, or build command for the affected package. Fix failures before expanding the verification scope.

## 3. Run Affected Gates

For TypeScript or shared-package changes, run from the repository root:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

For Python changes, run from `apps/ai-worker`:

```bash
uv run ruff check .
uv run mypy app
uv run pytest
```

For Prisma changes, also generate the client and create the appropriate named migration without a destructive reset. For Compose changes, validate with:

```bash
docker compose --env-file .env.example -f infra/docker-compose.yml config
```

## 4. Cross-Boundary Checks

- Contract change: verify NestJS plus every web or package consumer.
- Environment change: verify `.env.example`, Compose, and relevant docs agree.
- Public route or behavior change: update and review the relevant file under `docs`.
- Worker integration change: verify both the NestJS producer and FastAPI consumer while preserving the internal-only boundary.

## 5. Report Evidence

Report each command exactly as run and its pass/fail result. If a command cannot run, state the command, the concrete reason, and what remains unverified.
Do not claim checks passed when they were skipped, unavailable, or unrelated failures prevented completion.
