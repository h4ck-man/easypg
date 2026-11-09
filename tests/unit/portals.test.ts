import { describe, expect, it } from 'vitest';
import { createDemoAdapter } from '../../src/lib/api/demo';

async function login(email = 'manager@example.invalid') {
  const demo = createDemoAdapter();
  await demo.command('signIn', { email, password: 'demo-only' }, crypto.randomUUID());
  return demo;
}

describe('portal and follow-up presentation contract', () => {
  it('opens the supervisor portal and rejects the platform portal for a supervisor', async () => {
    const demo = await login();
    expect((await demo.readView('/supervisor')).portal).toBe('supervisor');
    await expect(demo.readView('/admin')).rejects.toMatchObject({ status: 403 });
  });

  it('updates a tentative departure without releasing inventory or changing dues, and rejects stale edits', async () => {
    const demo = await login();
    const before = await demo.readView('/rooms');
    const resident = await demo.readView('/residents/:id', { id: 'demo-resident-a' });
    const command = {
      residentId: resident.resident.id,
      agreementId: resident.resident.activeAgreement!.id,
      expectedVersion: String(resident.resident.activeAgreement!.version ?? 1),
      expectedHostelId: 'demo-hostel-a',
      expectedEndDate: '2026-09-10',
      departureIntent: 'tentative',
      notes: 'Call to confirm; this is only a plan',
      markContacted: 'true',
    };
    await demo.command('updateStayPlan', command, 'plan-update');
    expect(await demo.readView('/rooms')).toEqual(before);
    const after = await demo.readView('/residents/:id', { id: resident.resident.id });
    expect(after.resident.status).toBe('active');
    expect(after.financialSummary).toEqual(resident.financialSummary);
    expect(after.resident.activeAgreement!.expectedEndDate).toBe('2026-09-10');
    await expect(demo.command('updateStayPlan', command, 'stale-plan')).rejects.toMatchObject({ status: 409 });
  });

  it('records a walk-in enquiry without photos or an inventory commitment', async () => {
    const demo = await login();
    const before = await demo.readView('/rooms');
    await demo.command('createInquiry', {
      expectedHostelId: 'demo-hostel-a', contactName: 'Synthetic visitor', source: 'walk_in',
      partySize: '3', stayKind: 'short', acPreference: 'ac', sharingPreference: '3',
    }, 'enquiry');
    expect((await demo.readView('/inquiries')).items[0]).toMatchObject({ contactName: 'Synthetic visitor', partySize: 3, status: 'open' });
    expect(await demo.readView('/rooms')).toEqual(before);
  });

  it('gives the hostel owner a read-only portal', async () => {
    const demo = await login('hostelowner@example.invalid');
    expect((await demo.readView('/owner')).portal).toBe('owner');
    await expect(demo.command('checkOut', { residentId: 'demo-resident-a', checkOutDate: '2026-11-09' }, 'forbidden')).rejects.toMatchObject({ status: 403 });
    await expect(demo.readView('/setup')).rejects.toMatchObject({ status: 403 });
  });
});
