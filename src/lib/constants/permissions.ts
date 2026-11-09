import type { PortalKind, Role } from '$lib/api/contracts';

/** Display only. The API authorizes every request. */
export type AppRole = Role;

export const portalOptions = [
  { id: 'supervisor', label: 'Supervisor', detail: 'Run your assigned hostel day to day.' },
  { id: 'owner', label: 'Owner', detail: 'Track vacancy and dues across your properties.' },
  { id: 'portfolio', label: 'Super owner', detail: 'Oversee your organization and its properties.' },
  { id: 'admin', label: 'EasyPG administrator', detail: 'Set up organizations, hostels and staff access.' }
] as const;

export const roleLabels: Record<AppRole, string> = {
  manager: 'Supervisor', property_owner: 'Owner', organization_admin: 'Super owner',
  platform_admin: 'EasyPG administrator', resident: 'Resident'
};

export const rolePortals: Partial<Record<AppRole, PortalKind>> = {
  manager: 'supervisor', property_owner: 'owner', organization_admin: 'portfolio', platform_admin: 'admin'
};

export function portalHome(role: AppRole) {
  const portal = rolePortals[role];
  return portal ? '/' + portal : '/dashboard';
}

/** Loopback portal aliases. A hostname is only a workspace preference. */
export function portalFromHostname(hostname: string): PortalKind | undefined {
  return portalOptions.find(option => hostname === `${option.id}.easypg.localhost`)?.id;
}
