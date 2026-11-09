# Local EasyPG design

The user authorized completing the local app without approval pauses. Keep the existing SvelteKit static SPA, Astryx, and StyleX. Inspect all three projects, but do not modify either comparison project or reuse its backend implementation, schema, credentials, or resident data.

## Outcome

Run the frontend at `http://127.0.0.1:5180` with a new, independent PostgreSQL API in `../easypg-local-api`. Use a dedicated local PostgreSQL cluster on port 5488 and an HTTP API on 5188. Synthetic local accounts and records allow the complete workflow to be tested without touching another application's database.

Quick registration collects a portrait, identity image, name, and phone. One request saves them atomically and creates a **registered** person. It does not allocate a bed or imply identity verification. The saved profile offers **Assign bed**, which passes the existing resident ID to the separate admission operation. Admission validates available inventory, creates the stay/agreement and first rent invoice, and supports the existing payment and departure screens.

## Architecture and choices

Extending the SPA with server modules would violate its explicit boundary. Reusing either comparison backend would couple this work to source services and data. A separate, independently implemented Node/PostgreSQL API therefore fits the requested local outcome and existing contract.

Use bounded image data strings in the existing JSON command boundary, normalized in the browser and validated by the API. Store images privately in PostgreSQL; authorized image reads return no-store responses. Images are never embedded in list projections or retained by demo browser storage. Capture opens a camera on supporting phones and offers file selection otherwise; hardware camera behavior requires a real-device test.

The backend owns sessions, roles, hostel scope, validation, conflicts, exact balances, durable idempotency, and database transactions. Live API failures remain errors. Demo remains an explicit independent mode. Money crosses the boundary as integer decimal paise strings.

## Mobile behavior

At 390×844 every screen fits without document overflow. Primary actions and navigation have at least 44 px touch targets. Capture has visible previews, replace controls, labels, keyboard focus, busy/error states, and safe-area-aware navigation. Optional tenancy details do not obstruct the four-field registration.

## Completion evidence

Run frontend boundary verification, Svelte check, unit tests, build, and browser tests. Separately test the PostgreSQL API, authentication/authorization, image validation and reads, idempotency, competing admissions, payment balances, reload persistence, and the real browser-to-database onboarding journey. Record limitations without treating mocked frontend success as database evidence.
