---
name: commit-changes
description: Inspect, group, verify, and commit Nuri repository changes as atomic Conventional Commits. Use whenever the user asks Codex to commit, create commits, split changes into commits, or prepare local commits.
---

# Commit Changes

Create intentional, atomic local commits for the Nuri repository.

The root `AGENTS.md` is authoritative. Never push, open a pull request, or modify remote state unless the user explicitly asks.

## Safety Rules

- Commit only when the user explicitly requests a commit.
- Preserve pre-existing and unrelated user changes.
- Never use `git add -A`, `git add .`, or broad wildcard staging when unrelated changes exist.
- Never amend, rebase, reset, discard, or rewrite existing commits without explicit authorization.
- Never bypass hooks with `--no-verify`.
- Never commit `.env`, credentials, generated output, caches, local databases, object-store data, `.DS_Store`, or IDE metadata.
- Do not commit partially understood files.
- Stop before committing if ownership or intended scope cannot be determined safely.

## Commit Convention

Use:

```text
<type>(<scope>): <imperative summary>
```

Allowed types:

- `feat`: user-visible capability
- `fix`: defect correction
- `refactor`: behavior-preserving restructuring
- `test`: tests only
- `docs`: documentation only
- `chore`: repository maintenance
- `build`: dependencies or build tooling
- `ci`: continuous-integration configuration
- `perf`: measurable performance improvement
- `style`: formatting-only change
- `revert`: revert of an earlier commit

Preferred scopes:

- `web`
- `api`
- `ai-worker`
- `contracts`
- `ui`
- `config`
- `infra`
- `repo`

Omit the scope only when a change genuinely spans the repository and no narrower scope describes it.

Rules:

- Use lowercase type and scope.
- Write the summary in imperative mood.
- Keep the summary concise and do not end it with a period.
- Describe the outcome, not the implementation process.
- Use `!` and a `BREAKING CHANGE:` footer for incompatible public contract changes.
- Do not mix unrelated work merely to reduce the number of commits.

Examples:

```text
feat(web): add counseling record form
fix(api): enforce organization access for documents
feat(ai-worker): add supervision request validation
docs(repo): document local verification workflow
refactor(contracts): centralize counseling schemas
```

## Workflow

### 1. Inspect Repository State

Run:

```bash
git status --short
git diff --stat
git diff
git diff --cached --stat
git diff --cached
```

Identify:

- changes made for the current request;
- pre-existing or unrelated user changes;
- generated, sensitive, or accidental files;
- already-staged files and whether they belong to the requested work.

Do not alter existing staging blindly.

### 2. Plan Atomic Commits

Group files by one coherent outcome.

Split commits when changes:

- implement independent capabilities;
- combine refactoring with behavior changes that can stand alone;
- contain unrelated fixes;
- mix repository configuration with product behavior;
- affect separate applications without a shared contract or workflow.

Keep coupled producer/consumer changes together when separating them would leave the repository inconsistent, including shared contract changes and their API/web consumers.

Before staging, report the proposed commits with:

- commit message;
- included files;
- reason the files belong together.

If there is only one obvious atomic unit, proceed without asking for another confirmation. Ask for direction when grouping is materially ambiguous.

### 3. Verify

Use the `verification-loop` skill and the root `AGENTS.md`.

Run the smallest relevant checks first, followed by all required checks for the affected surface. Do not commit when required checks fail because of the proposed change.

If a check cannot run, report the exact limitation and commit only when the user has explicitly accepted the remaining risk.

### 4. Stage Precisely

Stage explicit paths for one commit at a time:

```bash
git add -- <path>...
```

Use interactive or patch staging only when a file contains multiple independent changes and splitting it is safe.

Then inspect exactly what will be committed:

```bash
git diff --cached --check
git diff --cached --stat
git diff --cached
```

Confirm that:

- every staged hunk belongs to the commit message;
- no unrelated or sensitive file is staged;
- required docs, contracts, migrations, and consumers are included;
- the staged tree represents a complete atomic unit.

### 5. Commit

Create the commit non-interactively:

```bash
git commit -m "<type>(<scope>): <imperative summary>"
```

Use an additional message paragraph only when the reason or compatibility impact is not clear from the diff.

After each commit, inspect:

```bash
git show --stat --oneline --decorate HEAD
git status --short
```

Repeat staging and committing for each planned unit.

### 6. Report

Report:

- commit hash and message for each created commit;
- files or purpose included in each commit;
- verification commands and results;
- remaining uncommitted changes;
- any skipped checks or risks.

Do not push unless separately requested.
