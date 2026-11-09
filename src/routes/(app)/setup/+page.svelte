<script lang="ts">
  import type { PageData } from './$types';
  import type { HostelSummary, Manager, Role } from '$lib/api/contracts';
  import { roleLabels } from '$lib/constants/permissions';
  import SetupForm from '$lib/components/portals/SetupForm.svelte';
  import { portal } from '$lib/components/portals/portal.stylex';
  import { sx } from '$lib/design/attrs';
  import { Card, Heading, Text } from '@astryx-svelte/core';

  let { data }: { data: PageData } = $props();
  let setup = $derived(data.setup);
  let organizations = $derived(setup.organizations.filter(org => org.status === 'active'));
  let accountMode = $state<'new' | 'existing'>('new');
  let existingAccountId = $state('');
  let existingAccounts = $derived.by(() => {
    const byAccount = new Map<string, { account: Manager; roles: Set<string> }>();
    for (const person of setup.staff) {
      const details = byAccount.get(person.userId) ?? { account: person, roles: new Set<string>() };
      details.roles.add(`${person.orgName || 'EasyPG'}: ${roleLabels[person.role]}`);
      byAccount.set(person.userId, details);
    }
    return [...byAccount.values()].map(({ account, roles }) => ({
      ...account,
      selectLabel: `${account.name} · ${account.email} — ${[...roles].sort().join('; ')}`
    })).sort((a, b) => a.name.localeCompare(b.name) || a.email.localeCompare(b.email));
  });
  let selectedAccount = $derived(existingAccounts.find(person => person.userId === existingAccountId));
  let staffRole = $state<Role | ''>('');
  let staffOrg = $state('');
  let selectedConfig = $state('');
  let configHostel = $derived(setup.hostels.find(hostel => hostel.id === selectedConfig));
  let staffOrganization = $derived(staffOrg || (organizations.length === 1 ? organizations[0].id : ''));
  const assignable = (role: Role | '') => role === 'manager' || role === 'property_owner';
</script>

{#snippet reminders(days = 7)}
  <label {...sx(portal.field)}>Departure reminder
    <select aria-label="Departure reminder" name="reminderDays" {...sx(portal.input)} value={String(days)}>
      <option value="7">7 days before</option><option value="4">4 days before</option><option value="3">3 days before</option>
    </select>
  </label>
{/snippet}

{#snippet assignments(hostels: HostelSummary[], selected: string[])}
  <fieldset {...sx(portal.fieldset)}>
    <legend>Assigned hostels</legend>
    <input type="hidden" name="hostelIds" value="[]" />
    {#if hostels.length}
      {#each hostels as hostel (hostel.id)}
        <label {...sx(portal.check)}><input type="checkbox" name="hostelChoice" value={hostel.id} checked={selected.includes(hostel.id)} />{hostel.name}</label>
      {/each}
    {:else}<Text color="secondary">Choose an organization with hostels to assign.</Text>{/if}
  </fieldset>
{/snippet}

<svelte:head><title>Setup — EasyPG</title></svelte:head>
<div {...sx(portal.stack)}>
  <header {...sx(portal.compact)}>
    <Heading level={1}>Setup</Heading>
    <Text color="secondary">Set up hostels, rooms and the people who run them.</Text>
  </header>

  {#if setup.capabilities.canCreateOrganization}
    <Card padding={5}>
      <section {...sx(portal.compact)} aria-label="Create organization">
        <Heading level={2}>Create organization</Heading>
        <SetupForm operation="createOrganization" label="Create organization">
          <div {...sx(portal.fields)}>
            <label {...sx(portal.field)}>Organization name <input name="name" required {...sx(portal.input)} /></label>
            <label {...sx(portal.field)}>Organization code <input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" title="Use lowercase letters, numbers and hyphens." {...sx(portal.input)} /></label>
          </div>
        </SetupForm>
      </section>
    </Card>
  {/if}

  {#if setup.capabilities.canCreateHostel}
    <Card padding={5}>
      <section {...sx(portal.compact)} aria-label="Create hostel">
        <Heading level={2}>Create hostel</Heading>
        {#if organizations.length}
          <SetupForm operation="createHostel" label="Create hostel">
            <div {...sx(portal.fields)}>
              <label {...sx(portal.field)}>Organization
                <select aria-label="Organization" name="organizationId" required {...sx(portal.input)} value={organizations.length === 1 ? organizations[0].id : ''}>
                  <option value="" disabled>Choose organization</option>
                  {#each organizations as org (org.id)}<option value={org.id}>{org.name}</option>{/each}
                </select>
              </label>
              <label {...sx(portal.field)}>Hostel name <input name="name" required {...sx(portal.input)} /></label>
              <label {...sx(portal.field)}>Hostel code <input name="code" required {...sx(portal.input)} /></label>
              <label {...sx(portal.field)}>City <input name="city" required {...sx(portal.input)} /></label>
              <label {...sx(portal.field)}>Street address <input name="addressLine1" required {...sx(portal.input)} /></label>
              <label {...sx(portal.field)}>Hostel gender policy
                <select aria-label="Hostel gender policy" name="genderPolicy" required {...sx(portal.input)}><option value="" disabled selected>Choose policy</option><option value="female">Female</option><option value="male">Male</option></select>
              </label>
              {@render reminders()}
            </div>
          </SetupForm>
        {:else}<Text color="secondary">Create an active organization before adding a hostel.</Text>{/if}
      </section>
    </Card>

    <Card padding={5}>
      <section {...sx(portal.compact)} aria-label="Hostel settings">
        <Heading level={2}>Hostel settings</Heading>
        {#if setup.hostels.length}
          <label {...sx(portal.field)}>Hostel to configure
            <select aria-label="Hostel to configure" bind:value={selectedConfig} {...sx(portal.input)}>
              <option value="" disabled>Choose hostel</option>
              {#each setup.hostels as hostel (hostel.id)}<option value={hostel.id}>{hostel.name}</option>{/each}
            </select>
          </label>
          {#if configHostel}
            {#key configHostel.id}
              <SetupForm operation="configureHostel" label="Save hostel settings" reset={false}>
                <input type="hidden" name="hostelId" value={configHostel.id} />
                <div {...sx(portal.fields)}>
                  <label {...sx(portal.field)}>Hostel gender policy
                    <select aria-label="Hostel gender policy" name="genderPolicy" required {...sx(portal.input)} value={configHostel.genderPolicy ?? 'unspecified'}>
                      {#if !configHostel.genderPolicy || configHostel.genderPolicy === 'unspecified'}<option value="unspecified">Unspecified</option>{/if}
                      <option value="female">Female</option><option value="male">Male</option>
                    </select>
                  </label>
                  {@render reminders(configHostel.reminderDays)}
                </div>
              </SetupForm>
            {/key}
          {/if}
        {:else}<Text color="secondary">No hostels to configure yet.</Text>{/if}
      </section>
    </Card>
  {/if}

  {#if setup.capabilities.canManageStaff}
    <Card padding={5}>
      <section {...sx(portal.compact)} aria-label="Add staff access">
        <Heading level={2}>Add staff access</Heading>
        <Text color="secondary">Create an account or add a workspace role to an existing account.</Text>
        {#if setup.allowedRoles.length}
          <SetupForm operation="createStaff" label="Add staff access">
            <div {...sx(portal.fields)}>
              <label {...sx(portal.field)}>Account type
                <select aria-label="Account type" bind:value={accountMode} {...sx(portal.input)}>
                  <option value="new">New account</option>
                  <option value="existing" disabled={!existingAccounts.length}>Existing account</option>
                </select>
              </label>
              {#if accountMode === 'new'}
                <label {...sx(portal.field)}>Full name <input name="name" required autocomplete="off" {...sx(portal.input)} /></label>
                <label {...sx(portal.field)}>Email address <input name="email" type="email" required autocomplete="off" {...sx(portal.input)} /></label>
                <label {...sx(portal.field)}>Initial password <input name="initialPassword" type="password" required minlength="12" maxlength="1024" autocomplete="new-password" {...sx(portal.input)} /></label>
              {:else}
                <label {...sx(portal.field)}>Existing account
                  <select aria-label="Existing account" bind:value={existingAccountId} required {...sx(portal.input)}>
                    <option value="" disabled>Choose account</option>
                    {#each existingAccounts as account (account.userId)}
                      <option value={account.userId}>{account.selectLabel}</option>
                    {/each}
                  </select>
                  <Text color="secondary">Uses the account’s existing password.</Text>
                </label>
                <input type="hidden" name="existingAccountId" value={selectedAccount?.userId ?? ''} />
                <input type="hidden" name="name" value={selectedAccount?.name ?? ''} />
                <input type="hidden" name="email" value={selectedAccount?.email ?? ''} />
              {/if}
              <label {...sx(portal.field)}>Role
                <select aria-label="Role" name="role" required bind:value={staffRole} {...sx(portal.input)}>
                  <option value="" disabled>Choose role</option>
                  {#each setup.allowedRoles as role (role)}<option value={role}>{roleLabels[role]}</option>{/each}
                </select>
              </label>
              {#if staffRole && staffRole !== 'platform_admin'}
                <label {...sx(portal.field)}>Organization
                  <select aria-label="Organization" name="organizationId" required value={staffOrganization} onchange={(event) => (staffOrg = event.currentTarget.value)} {...sx(portal.input)}>
                    <option value="" disabled>Choose organization</option>
                    {#each organizations as org (org.id)}<option value={org.id}>{org.name}</option>{/each}
                  </select>
                </label>
              {:else}<input type="hidden" name="organizationId" value="" />{/if}
            </div>
            {#if assignable(staffRole)}
              {#key staffOrganization}
                {@render assignments(setup.hostels.filter(hostel => hostel.organizationId === staffOrganization), [])}
              {/key}
            {:else}<input type="hidden" name="hostelIds" value="[]" />{/if}
          </SetupForm>
        {:else}<Text color="secondary">You have no staff roles to add.</Text>{/if}
      </section>
    </Card>

    <Card padding={5}>
      <section {...sx(portal.compact)} aria-label="Edit staff assignments">
        <Heading level={2}>Edit staff assignments</Heading>
        {#each setup.staff.filter(person => person.canManage && person.isActive && assignable(person.role)) as person (person.bindingId)}
          {@const currentIds = person.assignedHostelIds ?? (person.hostelId ? [person.hostelId] : [])}
          <div {...sx(portal.compact)}>
            <Heading level={3}>{person.name}</Heading>
            <Text color="secondary">{roleLabels[person.role]} · {person.orgName} · {person.email}</Text>
            <SetupForm operation="assignStaff" label={'Save assignments for ' + person.name} reset={false}>
              <input type="hidden" name="bindingId" value={person.bindingId} />
              <input type="hidden" name="currentHostelIds" value={JSON.stringify(currentIds)} />
              {#key JSON.stringify(currentIds)}
                {@render assignments(setup.hostels.filter(hostel => hostel.organizationId === person.organizationId), currentIds)}
              {/key}
            </SetupForm>
          </div>
        {:else}<Text color="secondary">No supervisors or owners to assign yet.</Text>{/each}
      </section>
    </Card>
  {/if}

  {#if setup.capabilities.canConfigureInventory}
    <Card padding={5}>
      <section {...sx(portal.compact)} aria-label="Add room batch">
        <Heading level={2}>Add room batch</Heading>
        <Text color="secondary">Add a run of rooms with the same bed count, cooling and rates.</Text>
        {#if setup.hostels.some(hostel => hostel.status === 'active')}
          <SetupForm operation="createRoomBatch" label="Create room batch">
            <div {...sx(portal.fields)}>
              <label {...sx(portal.field)}>Hostel
                <select aria-label="Hostel" name="hostelId" required {...sx(portal.input)}><option value="" disabled selected>Choose hostel</option>
                  {#each setup.hostels.filter(hostel => hostel.status === 'active') as hostel (hostel.id)}<option value={hostel.id}>{hostel.name}</option>{/each}
                </select>
              </label>
              <label {...sx(portal.field)}>Building <input name="buildingName" required {...sx(portal.input)} /></label>
              <label {...sx(portal.field)}>Floor <input name="floorLabel" required {...sx(portal.input)} /></label>
              <label {...sx(portal.field)}>Room prefix (optional) <input name="roomPrefix" {...sx(portal.input)} /></label>
              <label {...sx(portal.field)}>First room number <input name="startRoomNumber" type="number" min="1" step="1" required {...sx(portal.input)} /></label>
              <label {...sx(portal.field)}>Number of rooms <input name="roomCount" type="number" min="1" max="200" step="1" required {...sx(portal.input)} /></label>
              <label {...sx(portal.field)}>Beds per room
                <select aria-label="Beds per room" name="capacity" required {...sx(portal.input)}><option value="" disabled selected>Choose capacity</option>
                  {#each [1, 2, 3, 4] as count}<option value={count}>{count}</option>{/each}
                </select>
              </label>
              <label {...sx(portal.field)}>Cooling
                <select aria-label="Cooling" name="acType" required {...sx(portal.input)}><option value="" disabled selected>Choose cooling</option><option value="non_ac">Non-AC</option><option value="ac">AC</option></select>
              </label>
              <label {...sx(portal.field)}>Monthly rent (₹) <input name="monthlyRentRupees" type="number" min="0.01" step="0.01" required {...sx(portal.input)} /></label>
              <label {...sx(portal.field)}>Daily rate (₹) <input name="dailyRateRupees" type="number" min="0.01" step="0.01" required {...sx(portal.input)} /></label>
              <label {...sx(portal.field)}>Deposit (₹) <input name="depositRupees" type="number" min="0" step="0.01" required {...sx(portal.input)} /></label>
            </div>
          </SetupForm>
        {:else}<Text color="secondary">Create an active hostel before adding rooms.</Text>{/if}
      </section>
    </Card>
  {/if}
</div>
