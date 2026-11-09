<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { Button } from "@astryx-svelte/core";
  import { enhance, type Feedback } from "$lib/api/forms";
  import type { Inquiry } from "$lib/api/contracts";
  import { stayStyles as styles } from "$lib/components/stays/stay.stylex";
  import { sx } from "$lib/design/attrs";

  let { item, hostelId }: { item: Inquiry; hostelId: string } = $props();
  let editing = $state(false);
  let pending = $state(false);
  let status = $state<Inquiry["status"]>("open");
  let followUpDate = $state("");
  let version = $state(0);
  let expectedHostelId = $state("");
  let outcome = $state<Feedback | null>(null);

  function open() {
    status = item.status;
    followUpDate = item.followUpDate ?? "";
    version = item.version;
    expectedHostelId = hostelId;
    outcome = null;
    editing = true;
  }
</script>

{#if editing}
  <form
    method="POST"
    data-operation="updateInquiry"
    aria-label={`Update enquiry for ${item.contactName}`}
    {...sx(styles.stack)}
    use:enhance={() => {
      pending = true;
      outcome = null;
      return async ({ result, update }) => {
        try {
          await update({ reset: false });
          if (result.type === "success" || result.type === "failure")
            outcome = result.data;
          if (result.type === "success") editing = false;
        } finally {
          pending = false;
        }
      };
    }}
  >
    <input type="hidden" name="inquiryId" value={item.id} />
    <input type="hidden" name="expectedHostelId" value={expectedHostelId} />
    <input type="hidden" name="expectedVersion" value={version} />
    <div {...sx(styles.grid)}>
      <label {...sx(styles.field)}>
        Enquiry status
        <select name="status" bind:value={status} {...sx(styles.control)}>
          <option value="open">Open</option>
          <option value="contacted">Contacted</option>
          <option value="closed">Closed</option>
        </select>
      </label>
      <label {...sx(styles.field)}>
        Next follow-up date
        <input
          type="date"
          name="followUpDate"
          bind:value={followUpDate}
          {...sx(styles.control)}
        />
      </label>
    </div>
    <div {...sx(styles.actions)}>
      <Button
        label={pending ? "Saving…" : "Save enquiry status"}
        type="submit"
        isDisabled={pending}
        xstyle={styles.touch}
      />
      <Button
        label="Cancel"
        variant="secondary"
        isDisabled={pending}
        onclick={() => {
          editing = false;
          outcome = null;
        }}
        xstyle={styles.touch}
      />
      {#if version !== item.version || outcome?.code?.endsWith("CONFLICT")}
        <Button
          label="Load latest enquiry"
          variant="secondary"
          isDisabled={pending}
          xstyle={styles.touch}
          onclick={async () => {
            pending = true;
            try {
              await invalidateAll();
              open();
            } finally {
              pending = false;
            }
          }}
        />
      {/if}
    </div>
  </form>
{:else if item.status !== "closed"}
  <div {...sx(styles.actions)}>
    <Button
      label="Update enquiry"
      variant="secondary"
      onclick={open}
      xstyle={styles.touch}
    />
  </div>
{/if}
{#if outcome?.message}
  <p
    role={outcome.success ? "status" : "alert"}
    {...sx(outcome.success ? styles.text : styles.error)}
  >
    {outcome.message}
  </p>
{/if}
