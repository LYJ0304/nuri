---
name: frontend-patterns
description: React and Next.js App Router patterns for Nuri's web application. Use for components, state, data fetching, forms, accessibility, and rendering decisions in apps/web.
metadata:
  origin: ECC
  adapted-for: nuri
---

# Frontend Patterns

Use this skill for work in `apps/web` and for reusable UI primitives in `packages/ui`.
The root `AGENTS.md` remains authoritative if this guidance conflicts with repository rules.

## Boundaries

- Browser and server-side web code call the NestJS API only.
- Never access FastAPI, PostgreSQL, Redis, or MinIO directly from the web app.
- Put API shapes shared with NestJS in `packages/contracts` and validate them with Zod.
- Treat every `NEXT_PUBLIC_*` value as public.

## Next.js App Router

- Default to Server Components for rendering and server-side data access.
- Add `'use client'` only for browser APIs, event handlers, local state, effects, or client-only libraries.
- Keep client boundaries narrow; pass serializable data from Server Components.
- Use App Router primitives and colocate loading and error states with the route that owns them.
- Do not add Next.js route handlers as a second product API when NestJS owns the endpoint.

## React Components and State

- Prefer small components composed through props and children over inheritance or large configurable components.
- Keep props explicit and strictly typed; avoid `any` and unchecked type assertions.
- Keep state as local as possible. Use Zustand only for genuinely shared client state.
- Derive values during rendering when possible; do not mirror props or derived values into state.
- Use effects only to synchronize with an external system, and always clean up subscriptions and timers.
- Use functional state updates when the next value depends on the previous value.

## Data and Forms

- Validate API responses at the external boundary with the shared Zod contract.
- Handle loading, empty, error, and success states explicitly.
- Avoid client-side request waterfalls when independent work can run concurrently.
- Validate forms before submission and map server validation failures to clear user-facing messages.
- Do not duplicate domain validation rules that belong to the NestJS API.

## Accessibility and Performance

- Use semantic HTML, labelled form controls, keyboard-accessible interactions, and visible focus states.
- Prefer native controls before custom widgets; add ARIA only where semantics need clarification.
- Give images meaningful alternative text or mark decorative images appropriately.
- Measure before adding memoization. Avoid `useMemo` and `useCallback` used only by habit.
- Use stable keys from domain identifiers, not array indexes for reorderable collections.

## Verification

From the repository root, run the smallest relevant checks while iterating, then:

```bash
pnpm --filter @nuri/web lint
pnpm --filter @nuri/web typecheck
pnpm --filter @nuri/web build
```

If shared contracts or UI packages changed, verify every affected producer and consumer as required by `AGENTS.md`.
