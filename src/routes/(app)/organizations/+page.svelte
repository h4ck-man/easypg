<script lang="ts">
  import type { PageData } from './$types';
  import { enhance, feedback } from '$lib/api/forms';
  import { Badge, Button, Card, Dialog, TextInput } from '@astryx-svelte/core';
  import { sx } from '$lib/design/attrs';
  import { styles } from './page.stylex';
  import { formatPaiseCompact } from '$lib/formatters/money.js';
  import { formatDate } from '$lib/formatters/date.js';
  import Building2 from '@lucide/svelte/icons/building-2';
  import Plus from '@lucide/svelte/icons/plus';
  import Search from '@lucide/svelte/icons/search';
  import Power from '@lucide/svelte/icons/power';
  import Users from '@lucide/svelte/icons/users';
  import Home from '@lucide/svelte/icons/home';
  import AlertCircle from '@lucide/svelte/icons/alert-circle';
  import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';

  let { data }: { data: PageData } = $props();
  let form = $derived($feedback);
  let searchQuery = $state('');
  let statusFilter = $state<'all' | 'active' | 'inactive'>('all');
  let isCreateDialogOpen = $state(false);
  let isSubmitting = $state(false);
  let newOrgName = $state('');
  let newOrgSlug = $state('');
  let statusPending = $state<Record<string, boolean>>({});
  let statusErrors = $state<Record<string, string>>({});

  function actionError(result: unknown): string {
    if (typeof result === 'object' && result !== null && 'data' in result) {
      const data = (result as { data?: unknown }).data;
      if (typeof data === 'object' && data !== null && 'error' in data) {
        const error = (data as { error?: unknown }).error;
        if (typeof error === 'string') return error;
      }
    }
    return 'Organization status could not be updated.';
  }

  function setStatusPending(id: string, pending: boolean) {
    statusPending = { ...statusPending, [id]: pending };
  }

  function clearStatusError(id: string) {
    const next = { ...statusErrors };
    delete next[id];
    statusErrors = next;
  }

  $effect(() => {
    if (newOrgName) {
      newOrgSlug = newOrgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
  });

  let filteredOrgs = $derived(
    data.organizations.filter((org) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query || org.name.toLowerCase().includes(query) || org.slug.toLowerCase().includes(query);
      return matchesSearch && (statusFilter === 'all' || org.status === statusFilter);
    })
  );
</script>

<svelte:head><title>Organizations — EasyPG</title></svelte:head>

<div {...sx(styles.page)}>
  <div {...sx(styles.heading)}>
    <div>
      <p {...sx(styles.eyebrow)}>Platform administration</p>
      <h1 {...sx(styles.title)}>Organizations</h1>
      <p {...sx(styles.description)}>
        Platform client entities, tenant accounts, and group subscriptions.
      </p>
    </div>
    <Button label="New Organization" variant="primary" onclick={() => (isCreateDialogOpen = true)}>
      {#snippet icon()}<Plus size={17} />{/snippet}
    </Button>
  </div>

  <div {...sx(styles.filters)}>
    <!-- Search is a native control because Astryx TextInput intentionally supports text, email, and password only. -->
    <div {...sx(styles.searchWrap)}>
      <Search size={17} {...sx(styles.searchIcon)} aria-hidden="true" />
      <input
        type="search"
        aria-label="Search organizations by name or slug"
        placeholder="Search organizations by name or slug…"
        value={searchQuery}
        oninput={(event) => (searchQuery = (event.currentTarget as HTMLInputElement).value)}
        {...sx(styles.searchInput)}
      />
    </div>
    <div {...sx(styles.filterGroup)} role="group" aria-label="Organization status filter">
      <Button
        label={`All (${data.organizations.length})`}
        size="sm"
        variant={statusFilter === 'all' ? 'primary' : 'ghost'}
        onclick={() => (statusFilter = 'all')}
      />
      <Button
        label={`Active (${data.organizations.filter((org) => org.status === 'active').length})`}
        size="sm"
        variant={statusFilter === 'active' ? 'primary' : 'ghost'}
        onclick={() => (statusFilter = 'active')}
      />
      <Button
        label={`Inactive (${data.organizations.filter((org) => org.status === 'inactive').length})`}
        size="sm"
        variant={statusFilter === 'inactive' ? 'primary' : 'ghost'}
        onclick={() => (statusFilter = 'inactive')}
      />
    </div>
  </div>

  {#if form?.error && !isCreateDialogOpen}
    <div {...sx(styles.feedbackError)} role="alert">
      <AlertCircle size={17} /><span>{form.error}</span>
    </div>
  {/if}

  {#if filteredOrgs.length === 0}
    <Card xstyle={styles.emptyCard}>
      <Building2 size={40} {...sx(styles.emptyIcon)} />
      <h2 {...sx(styles.emptyTitle)}>No organizations found</h2>
      <p {...sx(styles.emptyDescription)}>
        {searchQuery
          ? 'No organizations matched your search filter.'
          : 'No organizations registered in system.'}
      </p>
      {#if searchQuery}<Button
          label="Clear Filter"
          variant="secondary"
          onclick={() => (searchQuery = '')}
        />{/if}
    </Card>
  {:else}
    <div {...sx(styles.grid)}>
      {#each filteredOrgs as org (org.id)}
        {@const isActive = org.status === 'active'}
        <Card xstyle={styles.orgCard}>
          <div {...sx(styles.cardHeader)}>
            <div {...sx(styles.orgIdentity)}>
              <div {...sx(styles.orgMark)}>{org.name.slice(0, 2).toUpperCase()}</div>
              <div {...sx(styles.orgNames)}>
                <h2 {...sx(styles.orgName)}>{org.name}</h2>
                <span {...sx(styles.slug)}>slug: {org.slug}</span>
              </div>
            </div>
            <Badge
              variant={isActive ? 'success' : 'neutral'}
              label={isActive ? 'Active' : 'Inactive'}
            />
          </div>
          <div {...sx(styles.statsGrid)}>
            <div>
              <span {...sx(styles.statLabel)}>Hostels</span><span {...sx(styles.statValue)}
                ><Home size={14} />{org.hostelCount}</span
              >
            </div>
            <div>
              <span {...sx(styles.statLabel)}>Residents</span><span {...sx(styles.statValue)}
                ><Users size={14} />{org.residentCount}</span
              >
            </div>
            <div>
              <span {...sx(styles.statLabel)}>Billed</span><span {...sx(styles.statValue)}
                >{formatPaiseCompact(org.billedPaise)}</span
              >
            </div>
            <div>
              <span {...sx(styles.statLabel)}>Outstanding</span><span
                {...sx(org.outstandingPaise > 0 ? styles.warningValue : styles.statValue)}
                >{formatPaiseCompact(org.outstandingPaise)}</span
              >
            </div>
          </div>
          <div {...sx(styles.orgMeta)}>
            <span>Created {formatDate(org.createdAt)}</span><span>{org.id.slice(0, 8)}</span>
          </div>
          <div {...sx(styles.cardFooter)}>
            <Button label="View Hostels" href="/hostels" variant="secondary" size="sm" />
            {#if statusErrors[org.id]}
              <div {...sx(styles.feedbackError)} role="alert">
                <AlertCircle size={15} /><span>{statusErrors[org.id]}</span>
              </div>
            {/if}
            <form
              method="POST"
              data-operation="toggleOrganization"
              use:enhance={() => {
                setStatusPending(org.id, true);
                clearStatusError(org.id);
                return async ({ result, update }) => {
                  if (result.type === 'failure' || result.type === 'error') {
                    statusErrors = { ...statusErrors, [org.id]: actionError(result) };
                  }
                  setStatusPending(org.id, false);
                  await update({ reset: false });
                };
              }}
            >
              <input type="hidden" name="organizationId" value={org.id} />
              <input type="hidden" name="currentStatus" value={org.status} />
              <Button
                label={statusPending[org.id] ? 'Updating…' : isActive ? 'Deactivate' : 'Activate'}
                type="submit"
                variant={isActive ? 'destructive' : 'ghost'}
                size="sm"
                isDisabled={statusPending[org.id]}
              >
                {#snippet icon()}<Power size={15} />{/snippet}
              </Button>
            </form>
          </div>
        </Card>
      {/each}
    </div>
  {/if}
</div>

<Dialog
  isOpen={isCreateDialogOpen}
  onOpenChange={(open) => (isCreateDialogOpen = open)}
  width={460}
  purpose="form"
  aria-label="Add New Organization"
>
  <div {...sx(styles.dialog)}>
    <div {...sx(styles.dialogHeader)}>
      <h2 {...sx(styles.dialogTitle)}>Add New Organization</h2>
      <p {...sx(styles.dialogDescription)}>
        Register a new client entity. Hostels and managers will be associated under this
        organization.
      </p>
    </div>
    <form
      method="POST"
      data-operation="createOrganization"
      {...sx(styles.dialogForm)}
      use:enhance={() => {
        isSubmitting = true;
        return async ({ update, result }) => {
          await update();
          isSubmitting = false;
          if (result.type === 'success') {
            isCreateDialogOpen = false;
            newOrgName = '';
            newOrgSlug = '';
          }
        };
      }}
    >
      {#if form?.error}<div {...sx(styles.feedbackError)} role="alert">
          <AlertCircle size={17} /><span>{form.error}</span>
        </div>{/if}
      <TextInput
        label="Organization Name"
        htmlName="name"
        placeholder="e.g. Sample Living Group"
        value={newOrgName}
        onChange={(value) => (newOrgName = value)}
        isRequired
      />
      <TextInput
        label="Slug / Identifier"
        htmlName="slug"
        placeholder="e.g. sample-living-group"
        value={newOrgSlug}
        onChange={(value) => (newOrgSlug = value)}
        description="Used for tenant identification and URL routing."
      />
      <div {...sx(styles.dialogActions)}>
        <Button
          label="Cancel"
          type="button"
          variant="secondary"
          onclick={() => (isCreateDialogOpen = false)}
        />
        <Button
          label={isSubmitting ? 'Creating…' : 'Create Organization'}
          type="submit"
          variant="primary"
          isDisabled={isSubmitting}
        >
          {#snippet icon()}{#if !isSubmitting}<CheckCircle2 size={15} />{/if}{/snippet}
        </Button>
      </div>
    </form>
  </div>
</Dialog>
