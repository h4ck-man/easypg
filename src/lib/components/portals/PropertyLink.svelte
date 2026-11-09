<script lang="ts">
  import { goto } from '$app/navigation';
  import { Banner, Button } from '@astryx-svelte/core';
  import { enhance } from '$lib/api/forms';
  import { portal } from './portal.stylex';

  let { hostelId, activeHostelId, href, label }: {
    hostelId: string; activeHostelId: string | null; href: string; label: string;
  } = $props();
  let switching = $state(false);
  let error = $state('');
</script>

{#if hostelId === activeHostelId}
  <Button {href} {label} variant="secondary" size="lg" xstyle={portal.control} />
{:else}
  <form method="POST" data-operation="switchHostel" use:enhance={() => {
    error = '';
    switching = true;
    return async ({ result }) => {
      try {
        if (result.type === 'success') await goto(href, { invalidateAll: true });
        if (result.type === 'failure') error = result.data.error ?? 'Unable to open this hostel.';
      } finally {
        switching = false;
      }
    };
  }}>
    <input type="hidden" name="hostelId" value={hostelId} />
    <Button label={switching ? 'Opening…' : label} type="submit" variant="secondary" size="lg" isDisabled={switching} xstyle={portal.control} />
    {#if error}<Banner status="error" title="Unable to open hostel" description={error} />{/if}
  </form>
{/if}
