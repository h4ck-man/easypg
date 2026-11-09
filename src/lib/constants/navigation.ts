import { portalHome, type AppRole } from './permissions.js';

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  mobileNav: boolean;
}

const item = (label: string, href: string, icon: string, mobileNav = false): NavItem =>
  ({ label, href, icon, mobileNav });
const hostels = item('Hostels', '/hostels', 'home', true);
const setup = item('Setup', '/setup', 'user-cog', true);
const rooms = item('Rooms & Beds', '/rooms', 'bed-double', true);
const residents = item('Residents', '/residents', 'users', true);
const payments = item('Payments', '/payments', 'credit-card');
const reports = item('Reports', '/reports', 'bar-chart-3');
const settings = item('Settings', '/settings', 'settings');
const leaving = item('Leaving soon', '/leaving-soon', 'calendar-clock', true);

export function getNavItems(role: AppRole): NavItem[] {
  const home = item('Overview', portalHome(role), 'layout-dashboard', true);
  switch (role) {
    case 'platform_admin': return [home, setup, item('Organizations', '/organizations', 'building-2'), hostels, item('Users', '/managers', 'users'), reports, settings];
    case 'organization_admin': return [home, hostels, setup, item('Staff', '/managers', 'user-cog'), residents, rooms, leaving, payments, reports, settings];
    case 'property_owner': return [home, hostels, rooms, residents, leaving, payments, reports, settings];
    case 'manager': return [home, leaving, item('Enquiries', '/inquiries', 'message-square'), residents, rooms, item('Check-In', '/check-ins', 'log-in'), item('Check-Out', '/check-outs', 'log-out'), payments, reports, settings];
    default: return [];
  }
}

export function getMobileNavItems(role: AppRole): NavItem[] {
  if (role === 'manager') {
    return [item('Overview', portalHome(role), 'layout-dashboard', true), rooms, item('Add resident', '/residents/new', 'user-plus', true), leaving, residents];
  }
  return getNavItems(role).filter(item => item.mobileNav).slice(0, 5);
}
