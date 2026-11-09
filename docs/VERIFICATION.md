# Local application verification — 9 November 2026

This evidence applies to the SvelteKit SPA and the independent sibling `easypg-local-api`, using a dedicated PostgreSQL 16 cluster. It does not certify either source comparison application or another backend implementation.

## Final command results

| Check | Result |
| --- | --- |
| `pnpm verify:boundary` | Passed: no backend modules, database schema, server actions, Tailwind or shadcn in the frontend |
| `pnpm check` | Passed: 0 errors, 0 warnings |
| `pnpm test:unit` | 28 passed |
| `pnpm build` | Passed: static output in `build/` |
| `pnpm test:e2e` | 12 passed, 21.2 seconds |
| Real-API browser suite | 23 scenarios passed across the full run and corrected-test rerun; see the failure record below |
| Backend `pnpm test` | 13 passed, including the parent integration test, against real PostgreSQL in an isolated schema |
| `git diff --check` | Passed |
| `pnpm local:status` | Frontend, API and database all running |

The complete live browser run initially returned **22 passed and one failed**. The older onboarding test selected the first option in the document, which now matched the new native stay-type control instead of the open bed selector. Scoping that test to the open listbox fixed the failure without changing product code. Its targeted rerun passed the full registration, admission, payment and checkout journey. The other 22 scenarios passed unchanged. This was not a backend or application failure.

The running local app is an explicit live-mode Vite process at `http://127.0.0.1:5180`, with `/api` proxied to the separate API at 5188 and PostgreSQL at 5488. Standard demo and mocked-boundary browser suites use temporary servers on 5190 and 5191. They are distinct from real PostgreSQL testing. The final build uses the static adapter; SvelteKit's intermediate server compilation output is not a runtime application backend.

## Verified behavior

### Four portals and setup

- Supervisor, hostel owner, super owner and platform administrator each reach their authorized portal. Wrong-portal requests return 403; choosing an admin tab does not confer access. Unqualified root routes by the actual session, and explicit portal selection clears an older deep-link destination.
- All four `*.easypg.localhost:5180` entry points were signed into successfully in Chromium. They are local loopback aliases, not registered external domains. Exact origin checks reject lookalike and unlisted origins.
- Hostel owners have read-only assigned-property access. Platform administrators configure the platform but cannot perform operational resident writes. Organization administrators remain scoped to their organization.
- The live browser setup journey created an organization, female and male hostels, two triple-sharing AC rooms, daily/monthly rates, a staff account, multiple property assignments, and a second membership. It then switched membership and verified the assigned portal.
- Existing account grants require explicit known-account selection and preserve that account's credentials. The UI shows its known workspace/role context. Duplicate-email new-account attempts and out-of-scope grants are rejected.
- SQL verification confirmed Jasmine has **45 rooms and 150 beds**. Its two supervisors exercise the shared-hostel model. Migration records show 001 through 004 applied, with no database reset.

### Supervisor work

- Phone and walk-in enquiries record accommodation preferences without changing inventory or invoices.
- Mobile admission supports day/month stay types, AC/non-AC and sharing filters, declared gender, quick tentative durations, an unknown departure date and follow-up date. A tested short admission issued exactly one day's ₹1,000 invoice.
- Departure plans are versioned. A competing update produces a conflict; loading the current plan permits an explicit retry. Marking contacted or confirming a planned date does not change balances or release inventory. Actual checkout releases the bed and retains financial history.
- In-app attention includes due follow-ups, overdue plans and date-unknown plans with a due follow-up. Property reminder windows support 3, 4 and 7 days and use Asia/Kolkata dates.
- Focused browser probes verified visibility refreshes both the sidebar attention badge and portal/list projections. Open departure edits retain their original version and unsaved notes when a refreshed row moves outside a filter or disappears after another supervisor checks it out; the latter shows a removed-stay notice and cancel action.
- The real mobile registration journey saved two different synthetic images, reloaded the profile and verified both JPEGs, denied anonymous image access, admitted the same person, recorded a ₹1 receipt, checked out, confirmed the receipt after reload, and visibly rejected a duplicate phone registration.

### Responsive and boundary checks

The live screen matrix visited **108 screens** across five seeded account contexts at **390×844 with touch enabled** and **1440×900**. There were no failed view requests, browser page errors or horizontal document overflow. Mobile navigation, account controls and tested onboarding actions meet the 44 px minimum. Additional workflow tests exercised touch-sized enquiry, setup and departure controls. These checks do not claim that every pixel or every possible control state was exhaustively audited.

The 12 standard browser scenarios cover demo navigation, deep reload, role presentation, edit/payment, admission/departure, mobile overflow, live API outage without demo fallback, malformed responses, validation, unreadable/oversized/missing images, demo registration reload without retaining image bytes, dropped-response retry with the same key, visible conflicts and rejected property switching.

Backend tests cover DTO compatibility, sessions/origin/CSRF, roles and property scope, private images, atomic invalid-image rollback, stale scope and duplicate phones, durable idempotency across API restart, competing admissions and payments, no overpayment, departure history, future-date rejection, role/membership assignment, room batches, reminder windows, version conflicts, portal pagination and access revocation. Tests create and remove their own schema; they do not reset live app tables. Staff request receipts use a slow per-request password contribution, and migration 004 redacts older fast fingerprints while preserving receipt history. Reusing a redacted legacy staff command key returns a conflict; new requests use new keys.

Final scoped code review found no blocking issues. Both comparison projects remained read-only; the Astryx pilot's pre-existing working-tree changes were preserved.

## Pre-merge review and walkthrough

The 9 November mobile walkthrough used the visible in-app browser at 390×844. It registered **Asha Demo Walkthrough** with a synthetic portrait and a clearly marked sample identity image, reloaded the saved profile, assigned Jasmine Room 106 / Bed B at ₹800 per day, and set a tentative departure of **12 November 2026** using the three-day shortcut. Leaving soon then displayed that same resident, date and ₹800 outstanding balance with **Follow-up due**. The stay remained active. The browser reported no application warnings/errors or horizontal page overflow. Screenshot evidence is local at `/tmp/easypg-mobile-walkthrough/`; no uploaded photos or runtime data are included in the repository.

Review corrected the OpenAPI admission schema to accept the form's optional `expectedHostelId` stale-draft guard. A new regression test reproduced rejection with the old schema and passed after the fix. The profile's unsupported fixed 30-day notice-period label was removed; no notice policy was invented to replace it. Screenshot review also caught long room/rate selectors extending beyond their mobile cards despite zero document overflow. A shrinkable grid track keeps both controls and their chevrons inside the card; touch and keyboard selection were verified at 390×844.

Fresh pre-merge verification again passed frontend checks, 28 unit tests, 12 standard browser scenarios and 13 backend tests. The real API run initially passed 22 of 23 scenarios: concurrent SvelteKit regeneration reloaded and cleared an admin setup form in the development server. After source changes stopped, that scenario passed on its isolated rerun. This development-server interruption is separate from the earlier selector correction above. Logs are at `/tmp/easypg-pr-verification/`.

## Evidence files

- `.local-verification/four-portals/`: synthetic supervisor, leaving-soon and departure-card mobile screenshots, plus desktop overview; visually inspected.
- `.local-verification/live-db/`: latest local browser output, including registration and saved-profile screenshots. Playwright may replace earlier artifacts on a rerun.
- `/tmp/easypg-portal-final/`: portal-entry and setup screenshots from the focused portal run; visually inspected.
- `/tmp/easypg-four-portals-final-build.log`: completed static build output.

## Practical limits

- Chromium mobile emulation was tested. Physical phone camera capture/permissions, iOS Safari and Android hardware were not tested. Identity images are stored, not automatically verified.
- The application is local development with synthetic accounts and data. External domains, production deployment and real resident operations are not configured. See `LOCAL_DEVELOPMENT.md` for account and runtime details.
- Reminders refresh inside the open application. There are no email, SMS or operating-system push notifications.
- Enquiries do not reserve beds. Actual admission and checkout apply immediately; future-dated occupancy changes are rejected.
- Admission issues one day's or one month's initial invoice. Automatic recurring billing, final settlement, deposit refunds and external payment processing are not implemented.
- Portal property cards use search and 25-item pagination; several older operational collections and setup lists remain unpaginated. No 100-hostel load test was performed.
- The backend retains successful idempotency receipts. Browser retry keys persist while their form remains mounted; reload-time recovery for an uncertain payment is not implemented.
- Visitor/maintenance modules and resident self-service remain outside this scope. Demo role selection is presentation simulation and does not verify backend permissions.
