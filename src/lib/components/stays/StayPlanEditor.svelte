<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { Button, TextInput } from "@astryx-svelte/core";
  import type { DepartureIntent } from "$lib/api/contracts";
  import { enhance, type Feedback } from "$lib/api/forms";
  import { sx } from "$lib/design/attrs";
  import { stayStyles as styles } from "./stay.stylex";

  let {
    agreementId,
    residentId,
    hostelId,
    version,
    expectedEndDate,
    departureIntent,
    followUpDate,
    notes,
    onEditingChange,
    noLongerActive = false,
  }: {
    agreementId: string;
    residentId: string;
    hostelId: string;
    version: number;
    expectedEndDate: string | null;
    departureIntent: DepartureIntent;
    followUpDate: string | null;
    notes: string;
    noLongerActive?: boolean;
    onEditingChange?: (editing: boolean) => void;
  } = $props();
  let editing = $state(false);
  let submitting = $state(false);
  let outcome = $state<Feedback | null>(null);
  let intent = $state<DepartureIntent>("unknown");
  let endDate = $state("");
  let nextContact = $state("");
  let draftNotes = $state("");
  let draftVersion = $state(0);
  let draftHostelId = $state("");
  let markContacted = $state(false);

  function open() {
    intent = departureIntent;
    endDate = expectedEndDate ?? "";
    nextContact = followUpDate ?? "";
    draftNotes = notes;
    draftVersion = version;
    draftHostelId = hostelId;
    markContacted = false;
    outcome = null;
    editing = true;
    onEditingChange?.(true);
  }
</script>

<div {...sx(styles.stack)}>
  {#if editing}
    <form
      method="POST"
      data-operation="updateStayPlan"
      aria-label="Departure plan"
      {...sx(styles.stack)}
      use:enhance={() => {
        submitting = true;
        outcome = null;
        return async ({ result, update }) => {
          try {
            await update({ reset: false });
            if (result.type === "success" || result.type === "failure")
              outcome = result.data;
            if (result.type === "success") {
              editing = false;
              onEditingChange?.(false);
            }
          } finally {
            submitting = false;
          }
        };
      }}
    >
      <input type="hidden" name="expectedHostelId" value={draftHostelId} />
      <input type="hidden" name="residentId" value={residentId} />
      <input type="hidden" name="agreementId" value={agreementId} />
      <input type="hidden" name="expectedVersion" value={draftVersion} />
      <input type="hidden" name="markContacted" value={String(markContacted)} />
      <div {...sx(styles.grid)}>
        <label {...sx(styles.field)}>
          Departure intent
          <select
            name="departureIntent"
            bind:value={intent}
            {...sx(styles.control)}
          >
            <option value="unknown">Date unknown</option>
            <option value="tentative">Tentative date</option>
            <option value="confirmed">Confirmed date</option>
          </select>
        </label>
        {#if intent !== "unknown"}
          <label {...sx(styles.field)}>
            Planned departure date
            <input
              type="date"
              name="expectedEndDate"
              bind:value={endDate}
              required
              {...sx(styles.control)}
            />
          </label>
        {:else}
          <input type="hidden" name="expectedEndDate" value="" />
        {/if}
        <label {...sx(styles.field)}>
          Next follow-up date
          <input
            type="date"
            name="followUpDate"
            bind:value={nextContact}
            {...sx(styles.control)}
          />
        </label>
        <TextInput
          label="Departure notes"
          htmlName="notes"
          bind:value={draftNotes}
          isOptional
        />
      </div>
      <label {...sx(styles.toggle)}>
        <input type="checkbox" bind:checked={markContacted} />
        Mark contacted now
      </label>
      {#if !noLongerActive}
        <p {...sx(styles.text)}>The bed remains occupied until the resident is checked out.</p>
      {/if}
      <div {...sx(styles.actions)}>
        <Button
          label={submitting ? "Saving…" : "Save departure plan"}
          type="submit"
          isDisabled={submitting}
          xstyle={styles.touch}
        />
        <Button
          label="Cancel"
          variant="secondary"
          isDisabled={submitting}
          onclick={() => {
            editing = false;
            onEditingChange?.(false);
            outcome = null;
          }}
          xstyle={styles.touch}
        />
      </div>
      {#if !noLongerActive && (draftVersion !== version || outcome?.code?.endsWith("CONFLICT"))}
        <Button
          label="Load latest plan"
          variant="secondary"
          isDisabled={submitting}
          xstyle={styles.touch}
          onclick={async () => {
            submitting = true;
            try {
              await invalidateAll();
              open();
            } finally {
              submitting = false;
            }
          }}
        />
      {/if}
    </form>
  {:else}
    <div {...sx(styles.actions)}>
      <Button
        label="Edit departure plan"
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
</div>
