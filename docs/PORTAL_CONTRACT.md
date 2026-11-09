# Four-portal implementation contract

The TypeScript projection shapes in `src/lib/api/contracts.ts` and named methods/paths in `operations.ts` are authoritative. JSON uses the existing `data`/`error` envelopes, cookie + CSRF, durable business idempotency, decimal paise strings. Inputs below remain string-valued `CommandInput`. An empty optional date means null. IDs are opaque. Authorization never derives from a requested portal/role/property.

## Roles, sessions and portal entry

`manager` → `/supervisor`; `property_owner` → `/owner`; `organization_admin` → `/portfolio`; `platform_admin` → `/admin`.

`signIn` may include `portal` (`supervisor|owner|portfolio|admin`); backend selects an enabled membership belonging to the account that matches, or returns forbidden. Without it choose an enabled membership deterministically. Result includes redirectTo matching authorized portal. Old `/dashboard` still works. `AppData` may include `memberships` and `activeMembershipId`; membership choices belong to current authenticated account only.

`switchMembership`: membershipId. Confirm it belongs to authenticated user and active org; set active context/property deterministically, invalidate old scope, return redirectTo. Switching property keeps current role and membership.

Property-owner reads are limited to assigned hostels and include summaries, rooms, residents (without private image URLs), payments, reports, leaving-soon and attention. Owners cannot write operations, access images, or enter setup. Supervisors have operational access in their assignments. Super owners have organization-scoped operations and setup. Platform administrators have platform setup and existing administrative reads. `/supervisor|owner|portfolio|admin` view endpoints require the matching role, not just a requested pathname.

## Reads

- Portal views accept `search` and `page` (one-based; page size 25). Portal stats describe entire authorized scope; `totalHostels` is filtered count, `hostels` current page, `organizations` relevant scope (empty for supervisor/owner if not needed), `attention` a limited preview with actual property IDs/names.
- `/leaving-soon`: all current active stays of selected hostel with actual plans, details and balances. UI can filter due/week/overdue/all. `needsFollowUp` honors configured 3/4/7-day window and follow-up dates. A past planned leaving date always needs attention; no departure is implied. Unknown departure may be reminded by followUpDate. Count leavingThisWeek for planned dates from today through +7. All date arithmetic uses Asia/Kolkata operational today.
- `/attention`: small counts for active hostel. Safe to refresh once per minute and on visibility/navigation. No fake notifications on read failure.
- `/inquiries`: active-hostel enquiries and real open/followup/available-bed counts; enquiry never changes availability.
- `/setup`: current allowed organizations/properties/staff, allowedRoles and server capability booleans. Manager/property_owner cannot read it. Manager DTO can include all assignedHostelIds.

## Operational commands

The resident profile does not show a notice period. Notice terms are not configured in this pilot; the legacy `noticePeriodDays` field is retained for wire compatibility and must not be presented as an agreed term. A future contract revision can deprecate or remove it.

- `updateStayPlan`: required `residentId`, `agreementId`, `expectedVersion`, `expectedHostelId`, `departureIntent`; optional `expectedEndDate`, `followUpDate`, `notes`, `markContacted` (`true|false`). Verify active stay/person/property/version; known intent requires date >= actual arrival; unknown clears expected date. Follow-up can be future; markContacted records backend timestamp. No inventory, invoice or actual-departure change. Increment version, log history.
- `createInquiry`: required `expectedHostelId`, `contactName`, `source` (`phone|walk_in`), `partySize` (1..20), `stayKind` (`short|long`), `acPreference` (`any|ac|non_ac`), `sharingPreference` (`any|1|2|3|4|private`); optional `phone`, `expectedArrival`, `expectedDeparture`, `followUpDate`, `notes`. Dates are tentative, may be future, and date ranges must be ordered if both known.
- `updateInquiry`: required `inquiryId`, `expectedVersion`, `expectedHostelId`, `status` (`open|contacted|closed`); optional `followUpDate`, `notes`. Stale update409.
- `checkIn` adds optional `stayKind`, `departureIntent`, `followUpDate`, and `expectedHostelId`. The browser sends the hostel captured when the draft opened; if supplied and different from the active hostel, return a conflict. It does not grant access. The existing `expectedEndDate` is a tentative/confirmed plan. Backend selected rate period dictates day/month and rejects contradictory stayKind. Default absent period is legacy month. Short: first invoice exactly one day's agreed rent; long: first invoice exactly one month's agreed rent. Invoice periods must reflect this. Tentative leaving date does not make a multi-day billed promise. Gender field must be supplied/updated when profile is undisclosed and new hostel policy is male/female; backend validates person-declared value and never infers gender from photo/name.

## Administration commands

- `createOrganization`: existing name/slug operation, platform only.
- `createHostel`: organizationId, name, code, city, addressLine1, genderPolicy (`male|female`), reminderDays (`3|4|7`). Default reminder7 if omitted. Validate org scope.
- `configureHostel`: hostelId, genderPolicy (`male|female|unspecified` for legacy), reminderDays (`3|4|7`). No incompatible change silently strands active residents; validate current occupants or reject actionable conflict.
- `createStaff`: name, email, role, organizationId (empty for platform), hostelIds (JSON array encoded as one string), optional initialPassword (required for new account, min12), existingAccountId (required for granting another membership to a known existing account). One operation creates a local account plus enabled membership/assignments; never emails credentials. An existing email without explicit existingAccountId returns409. Existing account grants use a known account selected from authorized staff, must match its email, reject an initialPassword, and keep its current password. Organization admins can only grant additional membership to accounts already in their organization; platform admins can explicitly select existing accounts across organizations. Platform role creation platform-only; orgadmin may create property_owner/manager for its own org. Supervisor/owner assignments must be nonempty and belong to authorized org; platform/orgadmin memberships need none.
- `assignStaff`: bindingId, hostelIds (JSON string array), currentHostelIds (JSON string array precondition). Validate actor may manage target and every assignment; mismatch409. Do not allow last self-access removal. Does not change account password or membership role.
- `createRoomBatch`: hostelId, buildingName, floorLabel, startRoomNumber (positive integer), roomCount (1..200), capacity (1..4), acType (`ac|non_ac`), monthlyRentPaise, dailyRatePaise, depositPaise; optional roomPrefix. Creates one complete batch of rooms/beds and explicit daily/monthly rate plans atomically. Existing room-number conflicts409; never partially create. UI uses `monthlyRentRupees`, `dailyRateRupees`, `depositRupees`; shared form encoder translates to paise fields.

Do not put account passwords into fixtures, persisted demo receipts, logs or page views. New admin/setup commands in demo may explicitly return a demo-unavailable error instead of pretending to create live access; demo account navigation and new read views must remain usable.
