```markdown
# nuri Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches you the core development conventions and workflows for the `nuri` TypeScript codebase. The repository focuses on building web applications without a specific framework, using custom coding standards and a modular approach. You'll learn how to follow naming conventions, structure imports/exports, and extend the counseling record creation form using established workflows.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `counselingRecordForm.tsx`, `userProfile.ts`

### Import Style
- Both default and named imports are used, sometimes mixed within the same file.
  - Example:
    ```typescript
    import React from 'react';
    import { useState } from 'react';
    import counselingService from '../services/counselingService';
    ```

### Export Style
- Prefer **named exports** for modules and components.
  - Example:
    ```typescript
    export function CounselingRecordForm() { ... }
    export const FORM_FIELDS = [...];
    ```

### Commit Patterns
- Commits are generally freeform, sometimes prefixed with `feature`.
- Keep commit messages concise (average ~47 characters).

## Workflows

### Add or Modify Form Fields
**Trigger:** When someone wants to add or update fields in the counseling record creation UI.  
**Command:** `/add-form-fields`

1. **Edit or add fields** in `apps/web/app/records/new/page.tsx`.
   - Locate the form component.
   - Add new input fields or update existing ones as needed.
   - Example:
     ```typescript
     // Add a new field for "Session Notes"
     <label htmlFor="sessionNotes">Session Notes</label>
     <textarea id="sessionNotes" name="sessionNotes" />
     ```
2. **Update styling** in `apps/web/app/styles.css` to ensure the new or modified fields match the application's look and feel.
   - Example:
     ```css
     /* Style for the new session notes textarea */
     #sessionNotes {
       width: 100%;
       min-height: 80px;
       margin-top: 8px;
     }
     ```
3. **Test** the form to ensure new fields appear and behave as expected.

## Testing Patterns

- Test files follow the `*.test.*` naming pattern.
  - Example: `counselingRecordForm.test.ts`
- The testing framework is not explicitly specified; review existing test files for structure and conventions.

## Commands

| Command           | Purpose                                                        |
|-------------------|----------------------------------------------------------------|
| /add-form-fields  | Add or modify fields in the counseling record creation form UI |
```
