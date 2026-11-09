<script lang="ts">
  import { Badge, Button, Card, TextInput } from "@astryx-svelte/core";
  import { enhance, type Feedback } from "$lib/api/forms";
  import { stayStyles } from "$lib/components/stays/stay.stylex";
  import { sx } from "$lib/design/attrs";
  import { formatDate } from "$lib/formatters/date";
  import InquiryStatusEditor from "./InquiryStatusEditor.svelte";
  import { styles } from "$lib/components/stays/supervisor.stylex";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let adding = $state(false);
  let pending = $state(false);
  let expectedHostelId = $state("");
  let arrival = $state("");
  let contactName = $state("");
  let notes = $state("");
  let outcome = $state<Feedback | null>(null);
  const acLabels = { any: "Any AC preference", ac: "AC", non_ac: "Non-AC" };
  const statusLabels = {
    open: "Open",
    contacted: "Contacted",
    closed: "Closed",
  };

  function open() {
    expectedHostelId = data.hostel?.id ?? "";
    arrival = "";
    contactName = "";
    notes = "";
    outcome = null;
    adding = true;
  }
</script>

<svelte:head><title>Enquiries — EasyPG</title></svelte:head>

<div {...sx(styles.page)}>
  <header {...sx(styles.header)}>
    <div>
      <h1 {...sx(styles.title)}>Enquiries</h1>
      <p {...sx(styles.intro)}>
        Record calls and walk-ins at {data.hostel?.name ??
          "the selected hostel"}. Enquiries do not reserve beds.
      </p>
    </div>
    {#if data.hostel && !adding}<Button
        label="New enquiry"
        onclick={open}
        xstyle={stayStyles.touch}
      />{/if}
  </header>

  {#if !data.hostel}
    <Card padding={4}
      ><p {...sx(stayStyles.text)}>
        Choose a hostel to view or record enquiries.
      </p></Card
    >
  {:else}
    <dl {...sx(styles.metrics)}>
      <div {...sx(styles.metric)}>
        <dt {...sx(styles.label)}>Open enquiries</dt>
        <dd {...sx(styles.value)}>{data.stats.open}</dd>
      </div>
      <div {...sx(styles.metric)}>
        <dt {...sx(styles.label)}>Follow-ups due</dt>
        <dd {...sx(styles.value)}>{data.stats.followUpsDue}</dd>
      </div>
      <div {...sx(styles.metric)}>
        <dt {...sx(styles.label)}>Beds available</dt>
        <dd {...sx(styles.value)}>{data.stats.availableBeds}</dd>
      </div>
    </dl>
    {#if outcome?.message}
      <p
        role={outcome.success ? "status" : "alert"}
        {...sx(outcome.success ? stayStyles.text : stayStyles.error)}
      >
        {outcome.message}
      </p>
    {/if}
    {#if adding}
      <Card padding={4} xstyle={styles.card}>
        <h2 {...sx(styles.titleSmall)}>Record an enquiry</h2>
        <form
          method="POST"
          data-operation="createInquiry"
          aria-label="New enquiry"
          {...sx(stayStyles.stack)}
          use:enhance={() => {
            pending = true;
            outcome = null;
            return async ({ result, update }) => {
              try {
                await update({ reset: false });
                if (result.type === "success" || result.type === "failure")
                  outcome = result.data;
                if (result.type === "success") adding = false;
              } finally {
                pending = false;
              }
            };
          }}
        >
          <input
            type="hidden"
            name="expectedHostelId"
            value={expectedHostelId}
          />
          <div {...sx(stayStyles.grid)}>
            <TextInput
              label="Contact name"
              htmlName="contactName"
              bind:value={contactName}
              hasAutoFocus
              isRequired
            />
            <label {...sx(stayStyles.field)}>
              Phone number (optional)
              <input
                type="tel"
                name="phone"
                autocomplete="tel"
                {...sx(stayStyles.control)}
              />
            </label>
            <label {...sx(stayStyles.field)}>
              Enquiry source
              <select name="source" {...sx(stayStyles.control)}>
                <option value="phone">Phone call</option>
                <option value="walk_in">Walk-in</option>
              </select>
            </label>
            <label {...sx(stayStyles.field)}>
              Party size
              <input
                type="number"
                name="partySize"
                min="1"
                max="20"
                step="1"
                value="1"
                required
                {...sx(stayStyles.control)}
              />
            </label>
            <label {...sx(stayStyles.field)}>
              Stay type
              <select name="stayKind" {...sx(stayStyles.control)}>
                <option value="short">Short stay</option>
                <option value="long">Long stay</option>
              </select>
            </label>
            <label {...sx(stayStyles.field)}>
              AC preference
              <select name="acPreference" {...sx(stayStyles.control)}>
                <option value="any">Any</option>
                <option value="ac">AC</option>
                <option value="non_ac">Non-AC</option>
              </select>
            </label>
            <label {...sx(stayStyles.field)}>
              Sharing preference
              <select name="sharingPreference" {...sx(stayStyles.control)}>
                <option value="any">Any</option>
                <option value="1">1 sharing</option>
                <option value="2">2 sharing</option>
                <option value="3">3 sharing</option>
                <option value="4">4 sharing</option>
                <option value="private">Private room</option>
              </select>
            </label>
            <label {...sx(stayStyles.field)}>
              Tentative arrival
              <input
                type="date"
                name="expectedArrival"
                bind:value={arrival}
                {...sx(stayStyles.control)}
              />
            </label>
            <label {...sx(stayStyles.field)}>
              Tentative departure
              <input
                type="date"
                name="expectedDeparture"
                min={arrival || undefined}
                {...sx(stayStyles.control)}
              />
            </label>
            <label {...sx(stayStyles.field)}>
              Next follow-up date
              <input
                type="date"
                name="followUpDate"
                {...sx(stayStyles.control)}
              />
            </label>
            <TextInput
              label="Notes"
              htmlName="notes"
              bind:value={notes}
              isOptional
            />
          </div>
          <div {...sx(stayStyles.actions)}>
            <Button
              label={pending ? "Recording…" : "Record enquiry"}
              type="submit"
              isDisabled={pending}
              xstyle={stayStyles.touch}
            />
            <Button
              label="Cancel"
              variant="secondary"
              isDisabled={pending}
              onclick={() => {
                adding = false;
                outcome = null;
              }}
              xstyle={stayStyles.touch}
            />
          </div>
        </form>
      </Card>
    {/if}

    <h2 {...sx(styles.titleSmall)}>Recent enquiries</h2>
    {#if data.items.length === 0}
      <Card padding={4}
        ><p {...sx(stayStyles.text)}>
          No enquiries recorded for this hostel yet.
        </p></Card
      >
    {:else}
      <div {...sx(stayStyles.stack)}>
        {#each data.items as item (item.id)}
          <Card
            role="article"
            aria-label={item.contactName}
            padding={4}
            xstyle={styles.card}
          >
            <div {...sx(styles.header)}>
              <div>
                <h3 {...sx(styles.titleSmall)}>{item.contactName}</h3>
                <p {...sx(stayStyles.text)}>
                  {item.source === "phone" ? "Phone call" : "Walk-in"} · {item.partySize}
                  {item.partySize === 1 ? "person" : "people"} · {item.stayKind ===
                  "short"
                    ? "Short stay"
                    : "Long stay"}
                </p>
              </div>
              <Badge
                label={statusLabels[item.status]}
                variant={item.status === "contacted" ? "success" : "neutral"}
              />
            </div>
            <p {...sx(stayStyles.text)}>
              {acLabels[item.acPreference]} · {item.sharingPreference === "any"
                ? "Any sharing"
                : item.sharingPreference === "private"
                  ? "Private room"
                  : `${item.sharingPreference} sharing`}
            </p>
            <dl {...sx(styles.details)}>
              <div>
                <dt {...sx(styles.label)}>Tentative arrival</dt>
                <dd {...sx(styles.detailValue)}>
                  {item.expectedArrival
                    ? formatDate(item.expectedArrival)
                    : "Unknown"}
                </dd>
              </div>
              <div>
                <dt {...sx(styles.label)}>Tentative departure</dt>
                <dd {...sx(styles.detailValue)}>
                  {item.expectedDeparture
                    ? formatDate(item.expectedDeparture)
                    : "Unknown"}
                </dd>
              </div>
              <div>
                <dt {...sx(styles.label)}>Next follow-up</dt>
                <dd {...sx(styles.detailValue)}>
                  {item.followUpDate
                    ? formatDate(item.followUpDate)
                    : "Not scheduled"}
                </dd>
              </div>
            </dl>
            {#if item.notes}<p {...sx(stayStyles.text)}>{item.notes}</p>{/if}
            {#if item.phone}<a
                href={`tel:${item.phone.replace(/[^+0-9]/g, "")}`}
                {...sx(styles.link)}>Call {item.phone}</a
              >{/if}
            <InquiryStatusEditor {item} hostelId={data.hostel.id} />
          </Card>
        {/each}
      </div>
    {/if}
  {/if}
</div>
