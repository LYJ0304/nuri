---
name: python-patterns
description: Typed Python 3.12 and FastAPI patterns for Nuri's internal AI worker. Use for worker endpoints, schemas, services, async code, and tests in apps/ai-worker.
metadata:
  origin: ECC
  adapted-for: nuri
---

# Python Patterns

Use this skill for `apps/ai-worker`. The root `AGENTS.md` defines the worker's architectural limits.

## Worker Boundary

- The FastAPI application is an internal AI worker, not a public product API.
- Do not move users, permissions, document metadata, or other product-domain ownership into the worker.
- Do not expose worker routes to browser code.
- Do not add real model providers, OCR engines, or vector stores unless the task explicitly requires them.
- Make job handling idempotent where practical and use the NestJS-owned job identifier.

## Python 3.12

- Use modern built-in generics (`list[str]`, `dict[str, int]`) and `X | None` unions.
- Type every public function and keep mypy strict mode passing.
- Prefer small, explicit functions and immutable data flow; avoid hidden import-time side effects.
- Catch specific exceptions, preserve the cause with `raise ... from error`, and do not silently swallow failures.
- Use context managers for files, streams, locks, and other resources.
- Use `pathlib.Path` for filesystem paths and timezone-aware datetimes for persisted or exchanged timestamps.
- Avoid mutable default arguments and broad `Any`; validate external data into concrete types.

## FastAPI and Pydantic

- Define request, response, and configuration models explicitly with Pydantic.
- Validate at the endpoint boundary and keep route handlers thin.
- Put processing logic in focused modules or services that can be tested without HTTP.
- Use dependency injection for shared resources and configuration.
- Use `async def` only for genuinely asynchronous I/O. Do not run blocking CPU or file work directly on the event loop.
- Return safe errors without stack traces, secrets, internal service URLs, or document contents.

## Testing and Dependencies

- Use pytest and pytest-asyncio already declared in `pyproject.toml`.
- Test validation failures, idempotent retries, service errors, and async behavior relevant to the change.
- Manage dependencies with uv only. Update `pyproject.toml` and `uv.lock` together when dependencies change.
- Do not introduce Poetry files or `requirements.txt`.

## Verification

Run from `apps/ai-worker`:

```bash
uv run ruff check .
uv run mypy app
uv run pytest
```

Use `uv sync` first only when the environment or lockfile needs synchronization.
