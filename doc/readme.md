# CFN Documentation

This directory contains product, architecture, and development rules for Clinical Function Navigator.

## Start Here

- `PROJECT_CHARTER.md`: Version 1.0 design freeze and scope
- `VISION.md`: product vision
- `ROADMAP.md`: staged delivery plan
- `RULES.md`: implementation rules
- `ADR/`: architectural decisions

## Current Directory Structure

```text
CFN/
  Code.gs
  Repository.gs
  Service.gs
  RiskService.gs
  SOAPService.gs
  index.html
  style.html
  script.html
  preview.html

  src/
    Code.gs
    Repository.gs
    Service.gs
    RiskService.gs
    SOAPService.gs
    EditorService.gs
    DatabaseService.gs

  html/
    index.html
    navigator.html
    studio.html
    style.html
    script.html
    components.html

  docs/
    README.md
    VISION.md
    PROJECT_CHARTER.md
    ROADMAP.md
    RULES.md
    ADR/

  tests/
    README.md

  legacy/
    PROJECT_CHARTER.root.md
```

## Runtime Compatibility

The current Apps Script runtime files remain at the project root to avoid breaking the working MVP.

The `src/` and `html/` directories are the target structure for maintainable development. Until a build/deploy flow exists, runtime changes must be mirrored between the root files and the organized copies.

## Legacy

Root-level `PROJECT_CHARTER.md` was moved to `legacy/PROJECT_CHARTER.root.md` because `docs/PROJECT_CHARTER.md` is now canonical.
