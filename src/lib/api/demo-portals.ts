import type { DemoFixtures, DepartureIntent, Inquiry, LeavingSoonItem, PortalDashboardData, PortalKind, Role } from './contracts';
import type { CommandInput, CommandResult, Operation } from './operations';
import { ApiError } from './errors';

export const portalForRole = (role: Role): PortalKind => role === 'platform_admin' ? 'admin' : role === 'organization_admin' ? 'portfolio' : role === 'property_owner' ? 'owner' : 'supervisor';
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const days = (a: string, b: string) => Math.round((Date.parse(a) - Date.parse(b)) / 86400000);
function reject(message: string, status = 422): never { throw new ApiError(message, status, status === 409 ? 'DEMO_CONFLICT' : status === 403 ? 'FORBIDDEN' : 'DEMO_VALIDATION'); }
const iso = (value?: string): string | null => {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) reject('Enter a valid date.');
  return value;
};
const checkScope = (data: DemoFixtures, input: CommandInput) => {
  if (input.expectedHostelId !== data.app.scope.activeHostelId) reject('The selected property changed. Reopen this form and try again.', 409);
};

export function refreshDemoPortals(data: DemoFixtures): void {
  const p = data.pages, role = data.app.scope.role, portal = portalForRole(role);
  const hostels = p['/hostels'].hostels;
  const hostel = hostels.find(h => h.id === data.app.scope.activeHostelId) ?? null;
  const now = today(), reminderDays = hostel?.reminderDays ?? 7;
  const items: LeavingSoonItem[] = Object.values(data.residentDetails)
    .filter(({ resident }) => resident.status === 'active' && resident.activeAgreement)
    .map(({ resident: r, financialSummary }) => {
      const a = r.activeAgreement!;
      const expected = a.expectedEndDate;
      const delta = expected ? days(expected, now) : null;
      const followUp = a.followUpDate ?? null;
      const needsFollowUp = (delta !== null && delta <= reminderDays) || Boolean(followUp && followUp <= now);
      return { hostelId: hostel?.id ?? '', hostelName: hostel?.name ?? '', residentId: r.id, name: r.fullName, phone: r.phone,
        roomNumber: r.room?.roomNumber ?? '', bedLabel: r.bed?.bedLabel ?? '', agreementId: a.id, stayKind: a.stayKind ?? 'long',
        expectedEndDate: expected, departureIntent: a.departureIntent ?? (expected ? 'tentative' : 'unknown'), followUpDate: followUp,
        lastContactedAt: a.lastContactedAt ?? null, notes: a.departureNotes ?? '', version: a.version ?? 1,
        daysUntilDeparture: delta, needsFollowUp, outstandingPaise: financialSummary.totalOutstandingPaise };
    });
  const due = items.filter(i => i.needsFollowUp), week = items.filter(i => i.daysUntilDeparture !== null && i.daysUntilDeparture >= 0 && i.daysUntilDeparture <= 7);
  const overdue = items.filter(i => i.daysUntilDeparture !== null && i.daysUntilDeparture < 0);
  p['/leaving-soon'] = { hostel, reminderDays, today: now, items, stats: { dueForFollowUp: due.length, leavingThisWeek: week.length, overduePlans: overdue.length, outstandingPaise: items.reduce((n, i) => n + i.outstandingPaise, 0) } };
  p['/attention'] = { leavingSoon: items.filter(i => i.daysUntilDeparture !== null && i.daysUntilDeparture >= 0 && i.daysUntilDeparture <= reminderDays).length, overduePlans: overdue.length, dueFollowUps: due.length };
  const inquiryItems = p['/inquiries']?.items ?? [];
  p['/inquiries'] = { hostel, items: inquiryItems, stats: { open: inquiryItems.filter(i => i.status !== 'closed').length,
    followUpsDue: inquiryItems.filter(i => i.status !== 'closed' && i.followUpDate && i.followUpDate <= now).length,
    availableBeds: p['/rooms'].stats.availableBeds } };
  const title: Record<PortalKind, string> = { supervisor: 'Supervisor workspace', owner: 'Owner overview', portfolio: 'Super owner portfolio', admin: 'EasyPG administration' };
  for (const kind of ['supervisor', 'owner', 'portfolio', 'admin'] as const) {
    p[`/${kind}`] = { portal: kind, title: title[kind], subtitle: kind === 'supervisor' ? hostel?.name ?? 'Select a hostel' : 'Synthetic demonstration workspace',
      hostels, organizations: kind === 'admin' || kind === 'portfolio' ? p['/organizations'].organizations : [],
      stats: { hostelCount: hostels.length, residentCount: p['/residents'].stats.active, availableBeds: p['/rooms'].stats.availableBeds,
        leavingSoonCount: week.length, overdueFollowUps: due.length, outstandingPaise: p['/reports'].financialSummary.totalOutstandingPaise },
      attention: due.slice(0, 5), page: 1, pageSize: 25, totalHostels: hostels.length } satisfies PortalDashboardData;
  }
  p['/setup'] = { organizations: p['/organizations'].organizations, hostels, staff: p['/managers'].managers,
    allowedRoles: role === 'platform_admin' ? ['platform_admin', 'organization_admin', 'property_owner', 'manager'] : ['property_owner', 'manager'],
    capabilities: { canCreateOrganization: role === 'platform_admin', canCreateHostel: role === 'platform_admin' || role === 'organization_admin',
      canManageStaff: role === 'platform_admin' || role === 'organization_admin', canConfigureInventory: role === 'platform_admin' || role === 'organization_admin' } };
  data.app.memberships = [{ id: `demo-membership-${role}`, role, organizationId: data.app.scope.organizationId, organizationName: 'Willow Living Demo', portal }];
  data.app.activeMembershipId = `demo-membership-${role}`;
}

export function checkDemoPortalRead(data: DemoFixtures, route: string): void {
  if (['/supervisor', '/owner', '/portfolio', '/admin'].includes(route) && route !== `/${portalForRole(data.app.scope.role)}`) reject('This portal belongs to a different role.', 403);
  if (route === '/setup' && !['platform_admin', 'organization_admin'].includes(data.app.scope.role)) reject('Administration access is required.', 403);
}

export const demoPortalOperations = new Set<Operation>(['updateStayPlan', 'createInquiry', 'updateInquiry', 'createHostel', 'configureHostel', 'createStaff', 'assignStaff', 'createRoomBatch', 'switchMembership']);
export function demoPortalCommand(data: DemoFixtures, operation: Operation, input: CommandInput): CommandResult {
  if (['createHostel', 'configureHostel', 'createStaff', 'assignStaff', 'createRoomBatch'].includes(operation))
    throw new ApiError('Use the local live workspace for hostel, inventory and staff setup. Demo access changes are not supported.', 501, 'DEMO_CAPABILITY_UNAVAILABLE');
  if (operation === 'switchMembership') {
    if (input.membershipId !== data.app.activeMembershipId) reject('This membership does not belong to the current demo account.', 403);
    return { success: true, message: 'Demo workspace selected.', redirectTo: `/${portalForRole(data.app.scope.role)}` };
  }
  if (!['manager', 'organization_admin'].includes(data.app.scope.role)) reject('This role cannot change resident plans or enquiries.', 403);
  checkScope(data, input);
  if (operation === 'updateStayPlan') {
    const detail = data.residentDetails[input.residentId], a = detail?.resident.activeAgreement;
    if (!a || detail.resident.status !== 'active' || a.id !== input.agreementId) reject('The active stay was not found.', 404);
    if (String(a.version ?? 1) !== input.expectedVersion) reject('This stay plan changed. Refresh and try again.', 409);
    const intent = input.departureIntent as DepartureIntent;
    if (!['tentative', 'confirmed', 'unknown'].includes(intent)) reject('Choose a departure plan.');
    const end = intent === 'unknown' ? null : iso(input.expectedEndDate);
    if (intent !== 'unknown' && !end) reject('Choose the expected leaving date.');
    if (end && end < a.startDate) reject('Leaving date cannot precede joining.');
    a.expectedEndDate = end; a.departureIntent = intent; a.followUpDate = iso(input.followUpDate);
    a.departureNotes = input.notes?.trim().slice(0, 1000) ?? '';
    if (input.markContacted === 'true') a.lastContactedAt = new Date();
    a.version = (a.version ?? 1) + 1;
    detail.activityTimeline.unshift({ id: crypto.randomUUID(), action: 'stay.plan_updated', entityType: 'resident', createdAt: new Date(), metadata: { simulation: true } });
    return { success: true, message: 'Stay plan updated. The bed remains occupied.' };
  }
  if (operation === 'createInquiry') {
    const name = input.contactName?.trim(), partySize = Number(input.partySize);
    if (!name || name.length > 120 || !Number.isInteger(partySize) || partySize < 1 || partySize > 20) reject('Enter a contact name and a party size from 1 to 20.');
    if (!['phone', 'walk_in'].includes(input.source) || !['short', 'long'].includes(input.stayKind) || !['any', 'ac', 'non_ac'].includes(input.acPreference) || !['any', '1', '2', '3', '4', 'private'].includes(input.sharingPreference)) reject('Choose valid enquiry preferences.');
    const arrival = iso(input.expectedArrival), departure = iso(input.expectedDeparture);
    if (arrival && departure && arrival > departure) reject('The leaving date must follow the joining date.');
    const item: Inquiry = { id: crypto.randomUUID(), contactName: name!, phone: input.phone?.trim() || null,
      source: input.source as Inquiry['source'], partySize, stayKind: input.stayKind as Inquiry['stayKind'],
      acPreference: input.acPreference as Inquiry['acPreference'], sharingPreference: input.sharingPreference as Inquiry['sharingPreference'],
      expectedArrival: arrival, expectedDeparture: departure, followUpDate: iso(input.followUpDate), notes: input.notes?.trim().slice(0, 1000) ?? '', status: 'open', createdAt: new Date(), version: 1 };
    data.pages['/inquiries'].items.unshift(item);
    return { success: true, message: 'Enquiry saved. No bed has been reserved.', resourceId: item.id };
  }
  const inquiry = data.pages['/inquiries'].items.find(i => i.id === input.inquiryId);
  if (!inquiry) reject('Enquiry not found.', 404);
  if (String(inquiry.version) !== input.expectedVersion) reject('The enquiry changed. Refresh and try again.', 409);
  if (!['open', 'contacted', 'closed'].includes(input.status)) reject('Choose a valid enquiry status.');
  inquiry.status = input.status as Inquiry['status'];
  if (input.followUpDate !== undefined) inquiry.followUpDate = iso(input.followUpDate);
  if (input.notes !== undefined) inquiry.notes = input.notes.trim().slice(0, 1000);
  inquiry.version++;
  return { success: true, message: 'Enquiry updated.' };
}
