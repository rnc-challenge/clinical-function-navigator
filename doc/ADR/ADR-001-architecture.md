# ADR-001: Layered Architecture

## Status

Accepted

## Decision

CFN uses a layered architecture:

```text
Presentation
Navigator
Studio
Application
Service
Repository
Storage
Google Spreadsheet
```

Studio and Navigator should not know spreadsheet details. Spreadsheet structure is hidden behind Service and Repository code.

## Consequences

- UI can evolve without matching spreadsheet columns.
- Spreadsheet schema changes are absorbed by Service/Repository transformations.
- Early Apps Script runtime files may remain at the root until a deployment flow supports structured source directories.
