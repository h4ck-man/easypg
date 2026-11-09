<script lang="ts">
  import { AppShell as AstryxAppShell } from '@astryx-svelte/core';
  import type { Snippet } from 'svelte';
  import type { NavItem } from '$lib/constants/navigation';
  import Sidebar from './Sidebar.svelte';
  import Header from './Header.svelte';
  import { sx } from '$lib/design/attrs';
  import { shell } from './shell.stylex';
  import { portalHome, type AppRole } from '$lib/constants/permissions';
  import type { MembershipOption } from '$lib/api/contracts';
  import { getNavIcon } from './icons';

  let {
    navItems = [],
    mobileNavItems = [],
    currentPath,
    user = null,
    role = 'resident',
    title = 'Dashboard',
    hostels = [],
    activeHostelId = '',
    showSelector = true,
    attentionCount = null,
    memberships = [],
    activeMembershipId = '',
    children
  }: {
    navItems?: NavItem[];
    mobileNavItems?: NavItem[];
    currentPath: string;
    user?: { id?: string; name?: string; email?: string } | null;
    role?: AppRole;
    attentionCount?: number | null;
    memberships?: MembershipOption[];
    activeMembershipId?: string;
    title?: string;
    hostels?: { id: string; name: string; code: string }[];
    activeHostelId?: string;
    showSelector?: boolean;
    children: Snippet;
  } = $props();
  const titles: Record<string, string> = {
    dashboard: 'Overview',
    supervisor: 'Overview',
    owner: 'Overview',
    portfolio: 'Overview',
    admin: 'Overview',
    setup: 'Setup',
    'leaving-soon': 'Leaving soon',
    inquiries: 'Enquiries',
    organizations: 'Organizations',
    hostels: 'Hostels',
    managers: 'Staff & Managers',
    rooms: 'Rooms & Beds',
    residents: 'Residents',
    'check-ins': 'Check-In',
    'check-outs': 'Check-Out',
    payments: 'Payments',
    reports: 'Reports',
    settings: 'Settings'
  };
  let resolvedTitle = $derived(currentPath === '/residents/new' ? 'Add resident' : (titles[currentPath.split('/')[1]] || title));
  let showShortcuts = $derived(mobileNavItems.length > 0 && currentPath !== '/residents/new' && currentPath !== '/check-ins');
</script>

<AstryxAppShell variant="section" height="fill" mobileNav={{ breakpoint: 'lg' }}>
  {#snippet sideNav()}<Sidebar {navItems} {currentPath} {user} {role} {attentionCount} />{/snippet}
  {#snippet topNav()}<Header
      title={resolvedTitle}
      {hostels}
      {activeHostelId}
      showSelector={showSelector && role !== 'platform_admin'}
      {user}
      {role}
      {memberships}
      {activeMembershipId}
    />{/snippet}
  <div {...sx(shell.content, showShortcuts && shell.contentWithShortcuts)}>{@render children()}</div>
  {#if showShortcuts}
    <nav aria-label="Mobile shortcuts" {...sx(shell.shortcuts)}>
      {#each mobileNavItems as item (item.href)}
        {@const Icon = getNavIcon(item.icon)}
        {@const active = (currentPath === '/dashboard' && item.href === portalHome(role)) || currentPath === item.href || currentPath.startsWith(item.href + '/')}
        <a href={item.href} aria-current={active ? 'page' : undefined} {...sx(shell.shortcut, active && shell.activeShortcut, item.href === '/residents/new' && shell.addShortcut)}>
          <Icon size={19} aria-hidden="true" />
          {item.label}{item.href === '/leaving-soon' && attentionCount ? ` · ${attentionCount}` : ''}
        </a>
      {/each}
    </nav>
  {/if}
</AstryxAppShell>
