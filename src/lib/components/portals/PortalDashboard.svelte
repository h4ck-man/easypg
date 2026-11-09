<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { Badge, Button, Card, Heading, Text } from '@astryx-svelte/core';
  import type { PortalDashboardData } from '$lib/api/contracts';
  import { formatDate } from '$lib/formatters/date';
  import { formatPaise } from '$lib/formatters/money';
  import { sx } from '$lib/design/attrs';
  import PropertyLink from './PropertyLink.svelte';
  import { portal } from './portal.stylex';

  let { view, activeHostelId }: { view: PortalDashboardData; activeHostelId: string | null } = $props();
  let query = $derived($page.url.searchParams.get('q') ?? '');
  let totalPages = $derived(Math.max(1, Math.ceil(view.totalHostels / view.pageSize)));

  function pageUrl(number: number, search = query) {
    const params = new URLSearchParams();
    if (search.trim()) params.set('q', search.trim());
    if (number > 1) params.set('page', String(number));
    return '/' + view.portal + (params.size ? '?' + params : '');
  }
</script>

<svelte:head><title>{view.title} — EasyPG</title></svelte:head>
<div {...sx(portal.stack)}>
  <header {...sx(portal.spread)}>
    <div {...sx(portal.compact)}>
      <Heading level={1}>{view.title}</Heading>
      <Text color="secondary">{view.subtitle}</Text>
    </div>
    <div {...sx(portal.row)}>
      {#if view.portal === 'supervisor'}
        {#if activeHostelId}
          <Button label="Enquiries" href="/inquiries" variant="secondary" size="lg" xstyle={portal.control} />
          <Button label="Add resident" href="/residents/new" variant="primary" size="lg" xstyle={portal.control} />
          <Button label="Payments" href="/payments" variant="secondary" size="lg" xstyle={portal.control} />
        {/if}
      {:else if view.portal === 'admin' || view.portal === 'portfolio'}
        <Button label="Open setup" href="/setup" variant="primary" size="lg" xstyle={portal.control} />
      {/if}
    </div>
  </header>

  <div {...sx(portal.metrics)} aria-label="Overview totals">
    {#each [
      ['Hostels', view.stats.hostelCount], ['Residents', view.stats.residentCount],
      ['Available beds', view.stats.availableBeds], ['Outstanding dues', formatPaise(view.stats.outstandingPaise)],
      ['Leaving soon', view.stats.leavingSoonCount], ['Follow-ups due', view.stats.overdueFollowUps]
    ] as [label, value] (label)}
      <Card padding={4}><div {...sx(portal.compact)}><Text type="supporting">{label}</Text><strong {...sx(portal.metric)}>{value}</strong></div></Card>
    {/each}
  </div>

  {#if view.portal !== 'admin'}
    <section aria-label="Departure follow-ups" {...sx(portal.compact)}>
      <div {...sx(portal.spread)}>
        <Heading level={2}>Departure follow-ups</Heading>
        {#if activeHostelId}
          <Button label="Open Leaving soon" href="/leaving-soon" variant="secondary" size="lg" xstyle={portal.control} />
        {/if}
      </div>
      {#if view.attention.length}
        <div {...sx(portal.grid)}>
          {#each view.attention as person (person.agreementId)}
            <Card padding={4}>
              <div {...sx(portal.compact)}>
                <Heading level={3}>{person.name}</Heading>
                <Text color="secondary">{person.hostelName ? person.hostelName + ' · ' : ''}Room {person.roomNumber} · {person.bedLabel}</Text>
                <Text>{person.expectedEndDate ? `${person.departureIntent === 'confirmed' ? 'Confirmed' : 'Tentative'}: ${formatDate(person.expectedEndDate)}` : 'No departure date yet'}</Text>
                {#if person.daysUntilDeparture !== null && person.daysUntilDeparture < 0}<Badge label="Overdue departure plan" variant="warning" />{/if}
                {#if person.needsFollowUp}<Badge label="Follow-up due" variant="warning" />{/if}
                {#if person.followUpDate}<Text color="secondary">Follow-up: {formatDate(person.followUpDate)}</Text>{/if}
                <Text>Outstanding: {formatPaise(person.outstandingPaise)}</Text>
                {#if person.hostelId}
                  <PropertyLink hostelId={person.hostelId} {activeHostelId} label="View resident" href={'/residents/' + encodeURIComponent(person.residentId)} />
                {/if}
              </div>
            </Card>
          {/each}
        </div>
      {:else}
        <p {...sx(portal.empty)}>No upcoming departure plans or follow-ups need attention.</p>
      {/if}
    </section>
  {/if}

  {#if view.portal === 'admin'}
    <section aria-label="Organizations" {...sx(portal.compact)}>
      <Heading level={2}>Organizations</Heading>
      {#if view.organizations.length}
        <div {...sx(portal.grid)}>
          {#each view.organizations as organization (organization.id)}
            <Card padding={4}>
              <div {...sx(portal.compact)}><Heading level={3}>{organization.name}</Heading>
                <Text>{organization.hostelCount} hostels · {organization.residentCount} residents</Text>
                <Badge label={organization.status === 'active' ? 'Active' : 'Inactive'} variant={organization.status === 'active' ? 'success' : 'neutral'} />
              </div>
            </Card>
          {/each}
        </div>
      {:else}<p {...sx(portal.empty)}>No organizations yet.</p>{/if}
    </section>
  {/if}

  <section aria-label="Hostels" {...sx(portal.compact)}>
    <div {...sx(portal.spread)}>
      <Heading level={2}>{view.portal === 'supervisor' || view.portal === 'owner' ? 'Assigned hostels' : 'Hostels'}</Heading>
      <form role="search" onsubmit={(event) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get('q');
        void goto(pageUrl(1, String(value ?? '')), { noScroll: true, keepFocus: true });
      }} {...sx(portal.row)}>
        <input type="search" name="q" aria-label="Search hostels" placeholder="Hostel name, code or city" value={query} {...sx(portal.input)} />
        <Button label="Search" type="submit" variant="secondary" size="lg" xstyle={portal.control} />
        {#if query}<Button label="Clear search" href={pageUrl(1, '')} variant="ghost" size="lg" xstyle={portal.control} />{/if}
      </form>
    </div>
    {#if view.hostels.length === 0}
      <p {...sx(portal.empty)}>{query ? 'No hostels match your search.' : 'No hostels are available in this workspace.'}</p>
    {:else}
      <div {...sx(portal.grid)}>
        {#each view.hostels as hostel (hostel.id)}
          <Card padding={4}>
            <div {...sx(portal.compact)}>
              <div {...sx(portal.row)}>
                <Badge label={hostel.code} variant="neutral" />
                {#if hostel.id === activeHostelId}<Badge label="Current hostel" variant="success" />{/if}
                {#if hostel.genderPolicy && hostel.genderPolicy !== 'unspecified'}<Badge label={hostel.genderPolicy === 'female' ? 'Female' : 'Male'} variant="neutral" />{/if}
              </div>
              <Heading level={3}>{hostel.name}</Heading>
              <Text color="secondary">{hostel.city}</Text>
              <Text>{hostel.residentCount} residents · {hostel.availableBeds} available beds</Text>
              {#if view.portal !== 'admin'}
                <PropertyLink hostelId={hostel.id} {activeHostelId} label="View rooms" href="/rooms" />
              {/if}
            </div>
          </Card>
        {/each}
      </div>
      <div {...sx(portal.spread)}>
        <Text color="secondary">Page {view.page} of {totalPages} · {view.totalHostels} hostels</Text>
        <nav aria-label="Hostel pages" {...sx(portal.row)}>
          {#if view.page > 1}<Button label="Previous page" href={pageUrl(view.page - 1)} variant="secondary" size="lg" xstyle={portal.control} />{/if}
          {#if view.page < totalPages}<Button label="Next page" href={pageUrl(view.page + 1)} variant="secondary" size="lg" xstyle={portal.control} />{/if}
        </nav>
      </div>
    {/if}
  </section>
</div>
