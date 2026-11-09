<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Banner, Button } from '@astryx-svelte/core';
  import { enhance, type Feedback } from '$lib/api/forms';
  import type { Operation } from '$lib/api/operations';
  import { sx } from '$lib/design/attrs';
  import { portal } from './portal.stylex';

  let { operation, label, children, reset = true }: {
    operation: Operation; label: string; children: Snippet; reset?: boolean;
  } = $props();
  let pending = $state(false);
  let feedback = $state<Feedback | null>(null);
</script>

<form method="POST" data-operation={operation} {...sx(portal.compact)} use:enhance={({ formData }) => {
  pending = true;
  feedback = null;
  if (formData.has('hostelIds')) {
    formData.set('hostelIds', JSON.stringify(formData.getAll('hostelChoice').map(String)));
    formData.delete('hostelChoice');
  }
  return async ({ result, update }) => {
    try {
      if (result.type === 'failure' || result.type === 'success') feedback = result.data;
      if (result.type === 'error') feedback = { error: result.error.message };
      if (result.type === 'success') await update({ reset });
    } finally {
      pending = false;
    }
  };
}}>
  {@render children()}
  {#if feedback?.error}
    <Banner status="error" title={feedback.code === 'CONFLICT' ? 'Details have changed' : 'Could not save'} description={feedback.error} />
    {#if feedback.fieldErrors && Object.keys(feedback.fieldErrors).length}
      <ul>{#each Object.values(feedback.fieldErrors) as message}<li>{message}</li>{/each}</ul>
    {/if}
  {:else if feedback?.success}
    <Banner status="success" title="Saved" description={feedback.message} />
  {/if}
  <div {...sx(portal.row)}>
    <Button label={pending ? 'Saving…' : label} type="submit" variant="primary" size="lg" xstyle={portal.control} isDisabled={pending} />
  </div>
</form>
