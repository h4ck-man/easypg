# Local PostgreSQL workspace

The running application consists of three independent processes:

| Process | Address | Owning files |
| --- | --- | --- |
| SvelteKit SPA / Vite | `http://127.0.0.1:5180` | This frontend repository |
| JSON API | `http://127.0.0.1:5188/api/v1` | `../easypg-local-api` |
| PostgreSQL 16 | `127.0.0.1:5488` | `../easypg-local-api/.local/postgres` |

Vite proxies `/api` to the independent API. No backend implementation is bundled into the SPA. The runtime supplies `VITE_API_MODE=live` explicitly; the default unconfigured demo remains available separately.

## Start, inspect, stop

For the full runtime, obtain the independent local API separately and place it at `../easypg-local-api`. It is not included in the frontend checkout. The standalone demo, static build, and standard frontend checks do not need the sibling API or PostgreSQL.

With the sibling API available, run from the frontend directory:

```sh
pnpm install --frozen-lockfile
pnpm local:start
pnpm local:status
pnpm local:stop
```

`local:start` initializes a dedicated cluster if missing, starts it on loopback, applies migrations and an idempotent synthetic seed, then starts API and frontend processes. Repeated starts preserve data. PostgreSQL tools (`initdb`, `pg_ctl`, `psql`, `createdb`) must be on PATH. Database data, runtime process IDs, and logs are in the sibling's ignored `.local/` folder. Stopping does not remove data. No existing source application or database is used or reset.

This is a local development environment. It uses loopback-only PostgreSQL with local trust authentication and deliberately documented synthetic account passwords. Deployment, remote exposure, real resident intake, backups, retention rules, password recovery, and a production identity/document review policy require a separate operational setup.

## Accounts and workflows

| Role | Email | Password |
| --- | --- | --- |
| Supervisor — Jasmine, 150 beds | `supervisor@easypg.local` | `Local-EasyPG-2026!` |
| Second supervisor — Jasmine | `supervisor2@easypg.local` | `Local-EasyPG-2026!` |
| Original supervisor — Mango | `manager@easypg.local` | `Local-EasyPG-2026!` |
| Hostel owner — assigned properties, read-only | `hostelowner@easypg.local` | `Local-EasyPG-2026!` |
| Super owner — organization portfolio | `owner@easypg.local` | `Local-EasyPG-2026!` |
| EasyPG administrator — platform setup | `admin@easypg.local` | `Local-EasyPG-2026!` |

Portal entry points are `http://supervisor.easypg.localhost:5180`, `http://owner.easypg.localhost:5180`, `http://portfolio.easypg.localhost:5180`, and `http://admin.easypg.localhost:5180`. Chromium resolves these loopback aliases without a hosts-file change. If a browser does not, use `http://127.0.0.1:5180` and select a portal. No external DNS or domains are provisioned. The API allowlists these exact origins; hostname choice is presentation routing, not authorization.

Jasmine is a synthetic female hostel with 45 rooms and 150 beds: ten double-sharing, ten triple-sharing and twenty-five four-sharing rooms, with mixed AC/non-AC inventory. It includes tentative, confirmed, overdue and unknown departure plans to exercise follow-ups. Male/female policy, reminder lead time and sharing/AC room batches can be configured through **Setup**. Existing seed records and user edits are preserved on restart.

Use synthetic test information. Add resident collects name, phone, portrait, and identity image in one operation. **Registered** means the profile was saved; it is not an identity verification or an active stay. Changing property resets an open registration draft; the API also rejects stale draft scope. **Assign bed** then selects inventory and rental terms. Admission creates an active stay and first rent invoice. Recorded payments update database-backed invoice balances; departure releases the bed and retains financial history. Admission and departure are immediate operations with dates capped at today in Asia/Kolkata; they do not schedule future reservations or future bed release.

**Enquiries** records phone calls and walk-ins with accommodation preferences without requiring photos or reserving a bed. At admission, short stay selects a daily rate and long stay selects a monthly rate. The first invoice covers one day or one month respectively; there is no recurring invoice scheduler or automatic final settlement.

**Leaving soon** stores unknown, tentative or confirmed departure intent separately from actual checkout. A supervisor can record a rough duration, expected date, follow-up date, notes and last contact. Hostel reminders support 3, 4 or 7 days. The sidebar badge includes due follow-ups and overdue plans; the list shows outstanding dues and call links. The workspace refreshes in-app reminders every minute while visible and when returning to the tab. Open plan edits retain their captured version so concurrent changes produce a visible conflict. No email, SMS or background push is sent.

**Setup** provisions organizations (platform only), hostels, rooms/beds and staff. New account creation and adding an existing account's membership are separate choices. Existing accounts keep their credentials; an organization administrator can grant a new role only to an account already visible in that organization. One account may have several memberships, and supervisors/hostel owners can have several property assignments. The account menu switches memberships through the API. Hostel-owner writes and platform operational writes are denied by the backend.

Mobile camera inputs use the browser's native capture/file picker. A supported phone may open its camera directly. Automated tests supply synthetic image files; they do not prove camera permission and capture behavior on a physical phone. Image reads require a live scoped session and use private, no-store responses.

## Verification

```sh
pnpm verify:boundary
pnpm check
pnpm test:unit
pnpm build
pnpm test:e2e
EASYPG_LOCAL_TEST_PASSWORD='Local-EasyPG-2026!' pnpm test:local
pnpm --dir ../easypg-local-api test
```

The standard browser suite uses ports 5190 (built demo) and 5191 (mocked live boundary), leaving the full live app on 5180. The local browser suite talks to the real PostgreSQL-backed application and creates uniquely named synthetic records. Backend integration tests use their own isolated test database/schema as documented in the backend. See `VERIFICATION.md` for the actual results from this handoff.
