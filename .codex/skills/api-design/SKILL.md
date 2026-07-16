---
name: api-design
description: REST API design guidance for Nuri's NestJS public API and shared Zod contracts. Use when adding or changing routes, payloads, pagination, errors, or versioned contracts.
metadata:
  origin: ECC
  adapted-for: nuri
---

# API Design

Use this skill when changing public HTTP behavior in `apps/api` or contracts in `packages/contracts`.
The root `AGENTS.md` is the higher-priority source of project architecture.

## Ownership and Contracts

- NestJS is the only public backend and system of record.
- FastAPI endpoints are internal worker endpoints and must not become browser-facing APIs.
- Define reusable request and response shapes in `packages/contracts` with Zod.
- Update the producer and every consumer together; never change a public contract silently.
- Use NestJS DTO validation for incoming requests where appropriate, even when a shared Zod schema describes the wire contract.

## Resource Design

- Use resource-oriented nouns and consistent plural paths.
- Match HTTP methods to semantics: `GET` reads, `POST` creates or starts an operation, `PATCH` partially updates, and `DELETE` removes.
- Use path parameters for identity and query parameters for filtering, sorting, and pagination.
- Return appropriate status codes: `200` for reads/updates, `201` for creation, and `204` only when there is intentionally no body.
- Use `400` for malformed input, `401` for missing/invalid authentication, `403` for denied access, `404` for absent resources, and `409` for state conflicts.
- Keep list responses predictable. Document pagination fields and impose bounded limits.

## Validation, Errors, and Security

- Validate path, query, headers, and bodies at the boundary; reject unknown fields where the route contract requires it.
- Keep one stable error envelope and do not expose stack traces, credentials, internal URLs, or database details.
- Authenticate first, then enforce organization and resource-level authorization in the owning domain service.
- Treat identifiers, filenames, content types, and object keys as untrusted input.
- Make retried job-creation requests idempotent where practical and key AI work by a NestJS-owned job identifier.

## Persistence and Side Effects

- Access PostgreSQL through Prisma and store only document metadata/object keys there.
- Store file contents through the API's MinIO integration, never in relational columns.
- Create audit records for security- or domain-significant mutations.
- Prefer durable Redis-backed jobs for real asynchronous AI processing; do not hide long-running worker calls behind synchronous public routes.

## Change Checklist

- Route belongs to an existing domain module or has a clear reason for a new capability.
- Shared Zod contract, NestJS DTO, implementation, and consumers agree.
- Success and error responses are documented and validated.
- Authentication, authorization, idempotency, and audit implications were considered.
- Relevant docs under `docs` were updated.
- Producer and all consumers pass lint, typecheck, build, and relevant tests.
