<script lang="ts">
  import { enhance } from '$lib/api/forms';
  import { SideNav, SideNavSection, SideNavItem, Avatar, Text, Button } from '@astryx-svelte/core';
  import type { NavItem } from '$lib/constants/navigation';
  import { getNavIcon } from './icons';
  import { portalHome, roleLabels, type AppRole } from '$lib/constants/permissions';
  import Brand from './Brand.svelte';
  import { sx } from '$lib/design/attrs';
  import { shell } from './shell.stylex';

  let {
    navItems = [],
    currentPath = '',
    user = null,
    role = 'resident',
    attentionCount = null
  }: {
    navItems?: NavItem[];
    currentPath?: string;
    user?: { id?: string; name?: string; email?: string } | null;
    role?: AppRole;
    attentionCount?: number | null;
  } = $props();
</script>

<SideNav xstyle={shell.navigation} aria-label="Main navigation">
  {#snippet header()}<a href={portalHome(role)} aria-label="EasyPG dashboard" {...sx(shell.brandHeader)}
      ><Brand /></a
    >{/snippet}
  <SideNavSection title={roleLabels[role]}>
    {#each navItems as item (item.href)}
      {@const Icon = getNavIcon(item.icon)}
      <SideNavItem
        label={item.href === '/leaving-soon' && attentionCount ? `${item.label} · ${attentionCount}` : item.label}
        href={item.href}
        isSelected={(currentPath === '/dashboard' && item.href === portalHome(role)) || currentPath === item.href || currentPath.startsWith(item.href + '/')}
        size="lg"
      >
        {#snippet icon()}<Icon {...sx(shell.icon)} />{/snippet}
      </SideNavItem>
    {/each}
  </SideNavSection>
  {#snippet footer()}
    <div {...sx(shell.footer)}>
      <a href="/settings" {...sx(shell.identity)}>
        <Avatar name={user?.name || user?.email || 'EasyPG user'} size={40} tooltip={false} />
        <span {...sx(shell.identityText)}
          ><Text type="label">{user?.name || 'User'}</Text><Text type="supporting"
            >{roleLabels[role] || role}</Text
          ></span
        >
      </a>
      <form method="POST" data-operation="signOut" use:enhance>
        <Button
          label="Log out of workspace"
          variant="ghost"
          size="lg"
          type="submit"
          xstyle={shell.control}
        />
      </form>
    </div>
  {/snippet}
</SideNav>
