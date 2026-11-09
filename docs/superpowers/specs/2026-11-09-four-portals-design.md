# Four EasyPG portals and departure follow-up

The user authorized implementation without approval pauses. Extend the running local application, preserve its data and all earlier work. Both comparison applications remain read-only. Frontend remains SvelteKit SPA with Astryx/StyleX; database logic belongs only to the independent sibling API.

## Product decisions

- Supervisor portal `/supervisor`: assigned hostel operations, quick enquiries, availability, resident intake, leaving-soon follow-ups and payments.
- Owner portal `/owner`: only owned/assigned properties, totals, vacancy and dues; drill into a property. New backend role `property_owner`.
- Super owner portal `/portfolio`: an organization's complete portfolio and authorized setup. Existing `organization_admin` role.
- EasyPG administrator portal `/admin`: organization, hostel and staff onboarding/access setup; existing `platform_admin` role. A business super owner never receives cross-customer platform authority.
- Existing `manager` role is labelled Supervisor. Existing accounts are preserved; add `hostelowner@easypg.local` for the owner portal. Existing `owner@easypg.local` remains the super owner account.
- One account may hold multiple organization/role memberships. A membership may have many property assignments and a property many assigned supervisors/owners. Explicit active membership and property are backend validated. Portal choice at login is a requested workspace, never a role grant.
- Local entry paths and explicit portal choice work immediately. Production DNS/domain purchase/deployment is not part of local implementation. Document a future apex/admin/app mapping without claiming external hosts exist.

## Supervisor interaction

A call or walk-in enquiry records very few details: contact, party size, short/long stay, AC preference, sharing preference, optional tentative arrival/leaving and follow-up date. No photos, bed reservation or payment is implied by enquiry. Enquiries can be contacted or closed.

Actual admission selects room/bed and rate: short stays use a per-day rate, long stays per month. A tentative end is optional; unknown stays may instead have a follow-up date. Use the selected rate's period as authoritative. A short stay initially bills one day; a long stay initially bills one month, both clearly displayed. Recurring invoices and final settlement remain explicitly outside this increment.

`expectedEndDate` is a plan, never an automatic departure. Its intent is `tentative`, `confirmed` or `unknown`. A supervisor can revise it, mark contact and set the next follow-up. Updates use agreement ID and version to prevent stale overwrites. A confirmed plan still requires actual checkout before releasing a bed.

Leaving soon is a persistent sidebar destination and dashboard attention area. Property reminder preference is 7 days by default, configurable to 3 or 4. Show resident/contact, room/bed, tentative date/intent, last contact, next follow-up, exact outstanding balance and actions. Overdue planned dates remain occupied and visibly overdue. Unknown dates can have follow-up reminders. App-open refresh/polling updates attention; no unimplemented email, SMS, OS push or background notifications are implied.

## Setup and representative data

Provide real admin forms to create organizations, create male/female hostels, create accounts/role memberships, assign multiple hostels, configure reminder lead time, and create room batches with 1–4 beds, AC/non-AC, monthly/daily rates. Commands are atomic and scope checked on the backend. Preserve previous synthetic seed records. Add a synthetic female property with 45 rooms/150 beds (10 double, 10 triple, 25 four-sharing), mixed AC/non-AC, multiple supervisors and residents with approaching/overdue/unknown departures and dues. Existing legacy properties may remain `unspecified` gender until configured; new hostels require male/female.

## Verification

Test all four portals, direct URL/API role denial, multi-property/membership assignments, real setup, enquiry no inventory change, tentative-date notifications across 3/4/7-day boundaries, overdue/unknown plans, exact dues, stale update conflict, no bed release from plan edits, short daily vs long monthly amounts and gender checks. Verify 390×844 touch layout and existing complete suites. Preserve explicit demo/live and document unsupported demo capabilities honestly.
