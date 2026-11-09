# Four portals implementation plan

> **For agentic workers:** Execute with independent file ownership and final integration review. User explicitly authorized immediate implementation without approval questions.

**Goal:** Four functional role-scoped portals, admin setup, supervisor enquiries and departure follow-ups in the running local app.

**Architecture:** Existing SPA plus sibling PostgreSQL API; append migrations and retain data. Shared browser contracts coordinate independently owned backend and UI work.

**Tech Stack:** SvelteKit, Astryx, StyleX, Node HTTP, PostgreSQL, Vitest, Playwright.

**Spec:** `../specs/2026-11-09-four-portals-design.md`

## Global constraints

- Preserve all current uncommitted work and source comparison apps.
- No backend runtime or database modules in frontend; data calls stay under src/lib/api.
- Roles and property assignments are authoritative only on backend.
- Tentative dates and reminders never release beds or create bookings.
- Paise crosses JSON as decimal integer strings; 44px controls, no 390×844 document overflow.

## Review focus

- Cross-property/organization access through owner roles or membership switches.
- Stale departure edits, unknown dates, overdue plans and property changes during forms.
- Short-stay rates accidentally creating monthly invoices or misleading totals.
- New account access or setup commands escaping administrator scope.
- Demo claiming live setup success, secrets retained in demo storage, or private image access after scope changes.

## Tasks

- [x] Root: define contracts/operation fields, extend demo and form boundary, regenerate schema, own integration docs/test orchestration.
- [x] Backend agent: additive migrations, multi-membership roles, portal projections, reminders/enquiries, daily rates, gender policy, admin setup commands, representative seed and PostgreSQL tests.
- [x] Supervisor agent: leaving-soon/enquiry pages, stay-plan editing, check-in short/long/preferences, reminders and profile context using shared contracts.
- [x] Portal agent: four portal landing pages/login/navigation, portal and membership UI, admin setup forms, mobile layout.
- [x] Root/review: test role boundaries, real workflows, all screens mobile/desktop; run all required checks; fix integration defects; restart and leave live.

## Execution decisions

- In-app reminders refresh while the application is open; pending work is derived from durable stay plans and follows the property's Asia/Kolkata calendar.
- Actual domain registration and production deployment are not needed to run the four local portals.
- Existing local role accounts remain valid; an additional hostel-owner identity avoids changing existing account grants.
