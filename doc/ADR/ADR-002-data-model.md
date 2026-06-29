# ADR-002: Studio JSON As The Editing Model

## Status

Accepted

## Decision

Studio edits patient support content as JSON, not as spreadsheet rows.

The save flow is:

```text
Studio -> JSON -> saveStudioContent() -> Spreadsheet rows
```

## Consequences

- Studio UI can follow clinical reasoning.
- Spreadsheet remains storage, not the source of UI layout.
- `saveStudioContent()` becomes the main mapping boundary.
