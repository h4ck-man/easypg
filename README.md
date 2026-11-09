# EasyPG frontend

A standalone frontend extracted from EasyPG’s Svelte native pilot. It preserves the Astryx Svelte components, StyleX styling, screens, and interaction patterns while replacing the original application backend with a browser API boundary.

The application supports a standalone synthetic demo and a local PostgreSQL-backed workspace. The independent local API lives beside this repository in `../easypg-local-api`. This frontend contains no database schema, migrations, database access, original business services, or authentication server. Other backends can implement the same browser contract.

## Run the full local application

The full runtime requires the independently supplied API at `../easypg-local-api`. This checkout does not include it. A fresh frontend clone can run the demo, build, and run the standard checks without the sibling API.

With the sibling API available and Node.js, pnpm, and PostgreSQL 16 tools installed:

```sh
pnpm local:start
pnpm local:status
```

Open **http://127.0.0.1:5180** or use a dedicated local portal. All accounts below use the synthetic development password `Local-EasyPG-2026!`.

| Portal | Local address | Account |
| --- | --- | --- |
| Supervisor | [Supervisor workspace](http://supervisor.easypg.localhost:5180) | `supervisor@easypg.local` |
| Hostel owner | [Assigned hostels](http://owner.easypg.localhost:5180) | `hostelowner@easypg.local` |
| Super owner | [Portfolio workspace](http://portfolio.easypg.localhost:5180) | `owner@easypg.local` |
| EasyPG administrator | [Platform setup](http://admin.easypg.localhost:5180) | `admin@easypg.local` |

These aliases resolve locally in the tested Chromium browser; they are not registered production domains. A portal choice never grants a role: the API checks the signed-in account and its active membership. The original `manager@easypg.local` account also remains available.

Choose **Add resident** to capture a portrait and identity image, enter a name and phone number, and save. The profile then offers **Assign bed** to complete admission. The local API stores residents, images, stays, invoices, and recorded payments in the dedicated PostgreSQL database. A captured identity document is stored, not automatically verified.

Supervisors can record phone or walk-in enquiries, select short/day-rate or long/monthly stays, and keep tentative departure dates or unknown dates with a follow-up date. **Leaving soon** shows upcoming and overdue plans, contact actions and outstanding dues. Hostel setup chooses 3-, 4-, or 7-day reminders. Plans never release inventory; actual checkout does. In-app reminders refresh while the workspace is open.

Hostel owners have read-only access to assigned properties. Super owners manage their organization's hostels and staff. Platform administrators create organizations and provision hostels, room batches and memberships. One account can hold several memberships, and each hostel can have multiple supervisors. The synthetic Jasmine property has 45 rooms and 150 beds with mixed sharing and AC options.

`pnpm local:stop` stops only this workspace's local processes and preserves its database. See [local setup and testing](docs/LOCAL_DEVELOPMENT.md) for runtime details and test commands.

## Run the independent demo

Use Node.js 22.12 or newer and pnpm 11.25.0 (the pinned package manager). Install dependencies, optionally copy the public configuration example, then start the development server:

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

Open `http://127.0.0.1:5180` after stopping the live local runtime, or run `pnpm dev --port 5190` to use a separate port. Use the demo login controls supplied by the application. Demo interactions illustrate presentation behavior; they are not persistence or authorization guarantees.

## Modes

| Setting | Demo | Live |
| --- | --- | --- |
| `VITE_API_MODE` | `demo` (default) | `live` |
| `VITE_API_BASE_URL` | Ignored for data access | `/api/v1` by default |
| Data | Synthetic browser fixtures | External API |
| Authentication | Demonstration only | Backend session and permissions |
| Backend outage | Not applicable | Visible error; never demo fallback |

These are public, build-time variables. Never place passwords, signing keys, or database connection strings in `VITE_` variables. Change configuration before building; deploy separate builds for separate backend environments.

## Build and verify

```sh
pnpm verify:boundary
pnpm check
pnpm test:unit
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

`pnpm test` runs the project’s full verification sequence. Read the actual command results for evidence; passing frontend tests does not certify an external backend or database.

The static build is written to `build/`. Configure the host to serve its `index.html` fallback for application routes. Route `/api/v1` to the backend before applying that fallback: an API error must not become an HTML success page. SvelteKit server actions and server routes are not available in this deployment.

## Handoff

- [Integration contract and checklist](docs/INTEGRATION.md)
- [Four-portal operations and permissions](docs/PORTAL_CONTRACT.md)
- [OpenAPI 3.1 contract](docs/openapi.json)
- [Verification evidence and limitations](docs/VERIFICATION.md)
- [Independent implementation evaluation](docs/EVALUATION.md)
- [Source provenance](docs/PROVENANCE.md)
- [Instructions for contributing agents](AGENTS.md)

The original full-stack implementation is a separate project. This extraction does not require the colleague to adopt its schema, services, ORM, or backend framework. The frontend communicates presentation requirements and agreed business requests; each backend remains responsible for its own correct implementation.

## Demo scope

The demo accounts are `manager@example.invalid`, `hostelowner@example.invalid`, `owner@example.invalid`, and `admin@example.invalid`, with the fixture-only password `demo-only`. The login shortcuts select these accounts. Changes remain in this tab’s session storage and survive reload; sign out and choose an account to reset the sample dataset. Do not enter real resident data in the demo. Administrative provisioning deliberately reports that live mode is required; it does not pretend to create accounts or save passwords.

The handoff preserves the native pilot screens: dashboard, organizations, properties, staff, rooms/beds, residents/detail, admission, departure, payments, reports, and settings. It does not merge the sovereign branch’s visitor, maintenance-ticket, or KYC modules. There is no resident self-service screen in this pilot.

Demo registration does not retain captured image bytes. Admission simulation updates the displayed stay and inventory; it does not implement deposit settlement. Existing sample invoices support payment interaction review. The independent local API stores documents privately and issues the first rent invoice on admission: one day for short stays, one month for long stays. It does not bill the whole tentative stay. Approval proposals, exclusive-room approval, transfers, recurring automatic billing, final settlement, deposit refunds, and payment-gateway processing remain separate capabilities; recording a received payment does not charge a bank account.

Regenerate the machine-readable wire schema and OpenAPI document after contract changes:

```sh
pnpm contract:generate
```
