# Clinical Function Navigator Version 1.0 Design Freeze

## Project Purpose

Clinical Function Navigator, CFN, is a platform for structuring knowledge needed for patient support and using that knowledge in clinical practice.

CFN is not a drug database.

CFN aims to be a Clinical Knowledge Platform where pharmacists, nurses, dietitians, and other professionals can think through patient support together.

## Product Philosophy

CFN is not a system that simply displays information.

CFN is a system that structures knowledge needed for patient support.

Before adding any feature, always ask:

> Does this improve patient support?

If yes, implement it.

If no, do not implement it.

## Architecture

CFN follows this layered structure:

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

Studio must not edit Google Spreadsheet directly.

The save flow is:

```text
Studio
  -> JSON
  -> saveStudioContent()
  -> Google Spreadsheet
```

All Studio save behavior must go through `saveStudioContent()`.

## Version 1.0 Scope

Version 1.0 implements only:

- Navigator
- Studio
- Spreadsheet storage
- GLP-1 receptor agonists

## Navigator

Navigator is the patient support screen.

Its purpose is to display patient support knowledge in the flow of clinical reasoning.

Navigator sections:

- Summary
- Assessment
- Education
- Safety Management
- Multidisciplinary Support
- Red Flag
- Functional Impact
- Clinical Pearl
- Evidence
- Guideline

## Studio

Studio is the knowledge editing screen.

Its purpose is to let pharmacists grow patient support content.

Studio is not a spreadsheet editing screen.

Studio is a CMS for patient support content.

Studio should focus on completing one drug class at a time.

Studio must not reproduce spreadsheet columns directly. The UI should follow the patient support flow.

## Database

Google Spreadsheet is the backend storage used by Studio.

Users are not expected to edit the Spreadsheet directly.

The Spreadsheet is storage, not the UI model.

Studio UI structure and Spreadsheet table structure should not be forced to match.

## Version 1.0 Out Of Scope

Version 1.0 does not implement:

- AI text generation
- SOAP automatic generation
- PubMed automatic retrieval
- RNC Evidence Library integration
- Notion integration
- PMDA integration
- Quality judgement AI
- Permission management
- Drag and drop
- External APIs

## UI Policy

- Keep the UI simple.
- Prefer cards.
- Follow the patient support flow.
- Do not reproduce the spreadsheet appearance.
- Navigator is designed as a patient support workspace.
- Studio is designed as a CMS.

## Code Quality

Keep responsibilities separated.

Prefer clear naming over comments.

Keep functions small.

Apply SOLID principles where they reduce long-term complexity.

Do not break existing code.

Improve with the smallest reasonable change.

When larger refactoring is needed, propose it before implementing.

Maintainability is the highest priority.

## Version 1.0 Completion Criteria

Version 1.0 is complete when this flow works:

```text
StudioでGLP-1受容体作動薬を編集できる
  -> 保存できる
  -> Navigatorで患者支援画面として表示できる
```
