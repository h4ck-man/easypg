import type { AppRole } from './permissions.js';

export interface NavItem {
  label: string;
  href: string;
  icon: string; // Lucide icon name
  mobileNav: boolean; // Show in mobile bottom nav
}

const PLATFORM_ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'layout-dashboard', mobileNav: true },
  { label: 'Organizations', href: '/organizations', icon: 'building-2', mobileNav: false },
  { label: 'Hostels', href: '/hostels', icon: 'home', mobileNav: true },
  { label: 'Users', href: '/managers', icon: 'users', mobileNav: false },
  { label: 'Reports', href: '/reports', icon: 'bar-chart-3', mobileNav: false },
  { label: 'Settings', href: '/settings', icon: 'settings', mobileNav: false }
];

const ORG_ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'layout-dashboard', mobileNav: true },
  { label: 'Hostels', href: '/hostels', icon: 'home', mobileNav: false },
  { label: 'Managers', href: '/managers', icon: 'user-cog', mobileNav: false },
  { label: 'Residents', href: '/residents', icon: 'users', mobileNav: true },
  { label: 'Rooms & Beds', href: '/rooms', icon: 'bed-double', mobileNav: true },
  { label: 'Payments', href: '/payments', icon: 'credit-card', mobileNav: true },
  { label: 'Reports', href: '/reports', icon: 'bar-chart-3', mobileNav: false },
  { label: 'Settings', href: '/settings', icon: 'settings', mobileNav: false }
];

const MANAGER_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'layout-dashboard', mobileNav: true },
  { label: 'Residents', href: '/residents', icon: 'users', mobileNav: true },
  { label: 'Rooms & Beds', href: '/rooms', icon: 'bed-double', mobileNav: true },
  { label: 'Check-In', href: '/check-ins', icon: 'log-in', mobileNav: false },
  { label: 'Check-Out', href: '/check-outs', icon: 'log-out', mobileNav: false },
  { label: 'Payments', href: '/payments', icon: 'credit-card', mobileNav: true },
  { label: 'Reports', href: '/reports', icon: 'bar-chart-3', mobileNav: false },
  { label: 'Settings', href: '/settings', icon: 'settings', mobileNav: false }
];

export function getNavItems(role: AppRole): NavItem[] {
  switch (role) {
    case 'platform_admin': return PLATFORM_ADMIN_NAV;
    case 'organization_admin': return ORG_ADMIN_NAV;
    case 'manager': return MANAGER_NAV;
    default: return [];
  }
}

export function getMobileNavItems(role: AppRole): NavItem[] {
  const items = getNavItems(role).filter(item => item.mobileNav);
  // Mobile bottom nav: max 4 items + "More"
  return items.slice(0, 4);
}
