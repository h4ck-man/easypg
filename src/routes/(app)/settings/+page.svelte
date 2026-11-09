<script lang="ts">
  import { roleLabels } from '$lib/constants/permissions';
  import { enhance } from '$lib/api/forms';
  import type { PageData } from './$types';
  import { Avatar, Badge, Button, Card } from '@astryx-svelte/core';
  import { sx } from '$lib/design/attrs';
  import { styles } from './page.stylex';
  import Shield from '@lucide/svelte/icons/shield';
  import User from '@lucide/svelte/icons/user';
  import Globe from '@lucide/svelte/icons/globe';
  import LogOut from '@lucide/svelte/icons/log-out';

  let { data }: { data: PageData } = $props();
  let roleLabel = $derived(roleLabels[data.scope?.role ?? 'resident']);
  let organizationName = $derived(data.memberships?.find(option => option.id === data.activeMembershipId)?.organizationName);
  let hostelName = $derived(data.hostels.find(hostel => hostel.id === data.scope?.activeHostelId)?.name);
</script>

<svelte:head><title>Settings — EasyPG</title></svelte:head>

<div {...sx(styles.page)}>
  <div>
    <p {...sx(styles.eyebrow)}>Your workspace</p>
    <h1 {...sx(styles.title)}>Settings</h1>
    <p {...sx(styles.description)}>Your profile, property access, and workspace preferences.</p>
  </div>

  <Card xstyle={styles.card}>
    <div {...sx(styles.cardHeader)}>
      <div {...sx(styles.cardTitleLine)}>
        <User size={18} />
        <h2 {...sx(styles.cardTitle)}>Profile</h2>
      </div>
      <p {...sx(styles.cardDescription)}>Your name, email and current role.</p>
    </div>
    <div {...sx(styles.profile)}>
      <Avatar name={data.user?.name ?? 'User'} alt={data.user?.name ?? 'User'} size="lg" />
      <div {...sx(styles.profileCopy)}>
        <strong {...sx(styles.profileName)}>{data.user?.name}</strong>
        <span {...sx(styles.profileEmail)}>{data.user?.email}</span>
        <Badge variant="neutral" label={roleLabel} />
      </div>
    </div>
  </Card>

  <Card xstyle={styles.card}>
    <div {...sx(styles.cardHeader)}>
      <div {...sx(styles.cardTitleLine)}>
        <Shield size={18} />
        <h2 {...sx(styles.cardTitle)}>Workspace access</h2>
      </div>
      <p {...sx(styles.cardDescription)}>The organization and hostel you are working in.</p>
    </div>
    <dl {...sx(styles.details)}>
      <div {...sx(styles.detailRow)}>
        <dt>Role</dt>
        <dd {...sx(styles.detailValue)}>{roleLabel}</dd>
      </div>
      <div {...sx(styles.detailRow)}>
        <dt>Organization</dt>
        <dd {...sx(styles.detailValue)}>{organizationName ?? (data.scope?.role === 'platform_admin' ? 'EasyPG' : 'Current organization')}</dd>
      </div>
      <div {...sx(styles.detailRow)}>
        <dt>Current hostel</dt>
        <dd {...sx(styles.detailValue)}>{hostelName ?? 'No hostel selected'}</dd>
      </div>
      <div {...sx(styles.detailRow)}>
        <dt>Available hostels</dt>
        <dd {...sx(styles.detailValue)}>{data.hostels.length}</dd>
      </div>
    </dl>
  </Card>

  <Card xstyle={styles.card}>
    <div {...sx(styles.cardHeader)}>
      <div {...sx(styles.cardTitleLine)}>
        <Globe size={18} />
        <h2 {...sx(styles.cardTitle)}>Localization &amp; System Standards</h2>
      </div>
      <p {...sx(styles.cardDescription)}>
        Standard financial currency, timezones, and number formats.
      </p>
    </div>
    <dl {...sx(styles.details)}>
      <div {...sx(styles.detailRow)}>
        <dt>Primary Currency</dt>
        <dd {...sx(styles.detailValue)}>{data.systemInfo.currency}</dd>
      </div>
      <div {...sx(styles.detailRow)}>
        <dt>Application Timezone</dt>
        <dd {...sx(styles.detailValue)}>{data.systemInfo.timezone}</dd>
      </div>
      <div {...sx(styles.detailRow)}>
        <dt>Formatting Locale</dt>
        <dd {...sx(styles.detailValue)}>{data.systemInfo.locale} (Indian Grouping: ₹1,00,000.00)</dd>
      </div>
      <div {...sx(styles.detailRow)}>
        <dt>Frontend version</dt>
        <dd {...sx(styles.detailValue)}>{data.systemInfo.version}</dd>
      </div>
    </dl>
    <div {...sx(styles.cardFooter)}>
      <span {...sx(styles.footerNote)}>EasyPG</span>
      <form method="POST" data-operation="signOut" use:enhance>
        <Button label="Sign Out" variant="destructive" size="lg" type="submit"
          >{#snippet icon()}<LogOut size={15} />{/snippet}</Button
        >
      </form>
    </div>
  </Card>
</div>
