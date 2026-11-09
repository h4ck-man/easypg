<script lang="ts">
  import { portalHome, roleLabels, type AppRole } from '$lib/constants/permissions';
  import type { MembershipOption } from '$lib/api/contracts';
  import { enhance } from '$lib/api/forms';
  import { TopNav, Selector, DropdownMenu, Avatar, Banner } from '@astryx-svelte/core';
  import { tick } from 'svelte';
  import { goto } from '$app/navigation';
  import ThemeToggle from './ThemeToggle.svelte';
  import { sx } from '$lib/design/attrs';
  import { shell } from './shell.stylex';

  interface HostelOption {
    id: string;
    name: string;
    code: string;
  }
  let {
    title = 'Dashboard',
    hostels = [],
    activeHostelId = '',
    showSelector = true,
    user = null,
    role = 'resident',
    memberships = [],
    activeMembershipId = ''
  }: {
    title?: string;
    hostels?: HostelOption[];
    activeHostelId?: string;
    showSelector?: boolean;
    user?: { id?: string; name?: string; email?: string } | null;
    role?: AppRole;
    memberships?: MembershipOption[];
    activeMembershipId?: string;
  } = $props();
  let selectedHostelId = $state('');
  let switchingHostel = $state(false);
  let formEl: HTMLFormElement | null = $state(null);
  let membershipForm: HTMLFormElement | null = $state(null);
  let switchingMembership = $state(false);
  let scopeError = $state('');
  let selectedMembership: MembershipOption | undefined = $state();
  async function changeMembership(id: string) {
    if (switchingMembership || switchingHostel || id === activeMembershipId) return;
    selectedMembership = memberships.find(option => option.id === id);
    await tick();
    if (selectedMembership) membershipForm?.requestSubmit();
  }
  let logoutForm: HTMLFormElement | null = $state(null);
  $effect(() => {
    selectedHostelId = activeHostelId;
  });
  let options = $derived(hostels.map((h) => ({ value: h.id, label: h.name, description: h.code })));
  async function changeHostel(value: string) {
    if (switchingHostel || switchingMembership || value === activeHostelId) return;
    selectedHostelId = value;
    await tick();
    formEl?.requestSubmit();
  }

  function submitLogout() {
    logoutForm?.requestSubmit();
  }
</script>

<form bind:this={logoutForm} method="POST" data-operation="signOut" use:enhance {...sx(shell.hidden)}></form>
<form
  bind:this={membershipForm}
  method="POST"
  data-operation="switchMembership"
  use:enhance={() => {
    scopeError = '';
    switchingMembership = true;
    const target = selectedMembership;
    return async ({ result }) => {
      try {
        if (result.type === 'failure') scopeError = result.data.error ?? 'Could not switch workspace';
        if (result.type === 'success' && target) await goto('/' + target.portal, { invalidateAll: true });
      } finally {
        switchingMembership = false;
      }
    };
  }}
  {...sx(shell.hidden)}
>
  <input type="hidden" name="membershipId" value={selectedMembership?.id ?? ''} />
</form>
<TopNav label="Workspace controls" xstyle={shell.header}>
  {#snippet startContent()}
    <div {...sx(shell.heading)}>
      <a href={portalHome(role)} {...sx(shell.breadcrumb)}>{roleLabels[role]}</a><span {...sx(shell.title)}>{title}</span>
    </div>
  {/snippet}
  {#snippet endContent()}
    <div {...sx(shell.headerActions)}>
      {#if showSelector && hostels.length > 0}
        <form
          method="POST"
          data-operation="switchHostel"
          use:enhance={() => {
            scopeError = '';
            switchingHostel = true;
            return async ({ update, result }) => {
              try {
                if (result.type === 'failure') scopeError = result.data.error ?? 'Could not switch property';
                await update({ reset: false });
              } finally {
                selectedHostelId = activeHostelId;
                switchingHostel = false;
              }
            };
          }}
          bind:this={formEl}
          {...sx(shell.hidden)}
        >
          <input type="hidden" name="hostelId" value={selectedHostelId} />
        </form>
        <div {...sx(shell.property)}>
          <Selector
            label="Switch property"
            isLabelHidden
            placeholder="Choose property"
            {options}
            value={selectedHostelId}
            onChange={changeHostel}
            size="lg"
            width="100%"
            isDisabled={switchingHostel || switchingMembership}
          />
        </div>
      {/if}
      <ThemeToggle />
      <DropdownMenu
        button={{
          label: 'User account menu',
          isIconOnly: true,
          variant: 'ghost',
          size: 'lg',
          icon: accountIcon,
          xstyle: shell.themeControl
        }}
        hasChevron={false}
        alignment="end"
        menuWidth={240}
        items={[
          ...(memberships.length > 1 ? [{
            type: 'section' as const,
            title: 'Switch workspace',
            items: memberships.map(option => ({
              label: `${option.organizationName} · ${roleLabels[option.role]}${option.id === activeMembershipId ? ' (current)' : ''}`,
              onClick: () => void changeMembership(option.id)
            }))
          }] : []),
          {
            type: 'section',
            title: user?.name || role,
            items: [
              {
                label: 'Settings',
                onClick: () => {
                  void goto('/settings');
                }
              },
              {
                label: 'Log out',
                variant: 'destructive',
                onClick: submitLogout
              }
            ]
          }
        ]}
      />
    </div>
  {/snippet}
</TopNav>
{#if scopeError}<Banner status="error" title="Could not switch" description={scopeError} />{/if}
{#snippet accountIcon()}<Avatar
    name={user?.name || user?.email || 'User'}
    size={32}
    tooltip={false}
  />{/snippet}
