---
name: create-github-issue
description: Draft and create well-scoped GitHub issues for the current Nuri repository using repository evidence and the GitHub CLI. Use when the user asks to report a bug, request a feature, capture technical debt, turn findings into an issue, or create/draft a GitHub issue.
---

# Create GitHub Issue

Create an actionable issue grounded in the current repository. Use `gh` for GitHub reads and writes.

## Workflow

1. Read the root `AGENTS.md` and obey all applicable repository instructions.
2. Confirm repository context with `git remote -v`, `git branch --show-current`, and `git status --short`.
3. Inspect the relevant code, configuration, tests, and documentation. Do not invent behavior, paths, or requirements.
4. Check authentication with `gh auth status`. If unavailable, provide the completed issue draft and the exact blocking condition; do not claim creation succeeded.
5. Search open and closed issues for likely duplicates. Prefer adding context to an existing issue over creating a duplicate.
6. Inspect available labels with `gh label list`. Apply only labels that already exist and clearly match.
7. Draft a concise title using an imperative outcome or precise defect statement.
8. Draft the body with only the sections that add value:
   - `## Context`: why the work matters and supporting repository evidence.
   - `## Problem`: current behavior or limitation.
   - `## Desired outcome`: observable end state, without prescribing unnecessary implementation.
   - `## Acceptance criteria`: verifiable checklist items.
   - `## Technical notes`: relevant files, constraints, dependencies, or architecture boundaries.
   - `## Out of scope`: explicit exclusions when scope could expand.
9. Show the proposed title, body, and labels before creation unless the user has already approved that exact content. A direct request to create an issue authorizes creation, but does not authorize guessing missing product decisions.
10. Create the issue with `gh issue create --title <title> --body-file <file>` and optional repeated `--label <label>` arguments. Use a temporary body file to avoid shell-escaping errors.
11. Return the issue number and URL. Never report success without the CLI response.

## Writing rules

- Keep one issue focused on one independently verifiable outcome.
- State facts as facts and assumptions as assumptions.
- Reference repository paths with backticks and include line numbers when useful.
- Write acceptance criteria as outcomes, not a hidden implementation plan.
- Include architecture constraints relevant to Nuri: the web calls NestJS only; NestJS owns the public API and domain state; FastAPI remains an internal AI worker.
- Never include secrets, `.env` values, credentials, private customer data, or raw sensitive logs.
- Do not assign users, milestones, projects, or new labels unless the user explicitly requests it.
- Do not modify repository files while creating an issue unless the user separately asks for code changes.

## Duplicate handling

If a likely duplicate exists, present its URL and explain the overlap. Do not create another issue unless the user explicitly asks to proceed after seeing the duplicate.

## Failure handling

If `gh issue create` fails, preserve the draft, report the command's relevant error, and suggest the smallest corrective action. Do not retry with broader permissions or a different repository without user approval.
