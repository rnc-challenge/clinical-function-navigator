# CFN Development Rules

## Patient Support First

Before adding a feature, ask:

> Does this improve patient support?

If the answer is no, do not implement it.

## Studio Save Flow

Studio must not write to Spreadsheet directly.

The only allowed save flow is:

```text
Studio -> JSON -> saveStudioContent() -> Service -> Repository -> Spreadsheet
```

## UI Rules

- Do not reproduce spreadsheet layouts.
- Navigator follows the patient support flow.
- Studio is a CMS for patient support content.
- Keep the UI simple and card-oriented.

## Code Rules

- Keep existing runtime files working.
- Prefer small functions with clear names.
- Separate Presentation, Service, Repository, and Storage responsibilities.
- Propose larger refactoring before implementing it.
