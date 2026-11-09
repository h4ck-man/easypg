<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import type { LeavingSoonItem } from "$lib/api/contracts";
  import { Badge, Button, Card } from "@astryx-svelte/core";
  import StayPlanEditor from "$lib/components/stays/StayPlanEditor.svelte";
  import { stayStyles } from "$lib/components/stays/stay.stylex";
  import { sx } from "$lib/design/attrs";
  import { formatDate, formatDateTime } from "$lib/formatters/date";
  import { formatPaise } from "$lib/formatters/money";
  import { styles } from "$lib/components/stays/supervisor.stylex";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  const filters = [
    { id: "followups", label: "Follow-ups due" },
    { id: "week", label: "Next 7 days" },
    { id: "overdue", label: "Overdue plans" },
    { id: "all", label: "All plans" },
  ] as const;
  let filter = $state<(typeof filters)[number]["id"]>("all");
  let refreshing = $state(false);
  let scopeKey = $derived(JSON.stringify([data.scope.userId, data.activeMembershipId, data.scope.role, data.hostel?.id]));
  let openDrafts = $state<{ scope: string; item: LeavingSoonItem }[]>([]);
  let currentDrafts = $derived(openDrafts.filter(draft => draft.scope === scopeKey));
  let activeAgreements = $derived(new Set(data.items.map(item => item.agreementId)));
  let items = $derived([
    ...data.items.filter((item) => {
      if (currentDrafts.some(draft => draft.item.agreementId === item.agreementId)) return true;
      const days = item.daysUntilDeparture;
      if (filter === "followups") return item.needsFollowUp;
      if (filter === "week") return days !== null && days >= 0 && days <= 7;
      if (filter === "overdue") return days !== null && days < 0;
      return true;
    }),
    ...currentDrafts.filter(draft => !activeAgreements.has(draft.item.agreementId)).map(draft => draft.item),
  ]);
  $effect(() => {
    if (scopeKey) openDrafts = [];
  });

  const intentLabel = {
    unknown: "Date unknown",
    tentative: "Tentative",
    confirmed: "Confirmed",
  };
</script>

<svelte:head><title>Leaving soon — EasyPG</title></svelte:head>

<div {...sx(styles.page)}>
  <header {...sx(styles.header)}>
    <div>
      <h1 {...sx(styles.title)}>Leaving soon</h1>
      <p {...sx(styles.intro)}>
        Follow up on planned departures. {data.hostel?.name ??
          "Select a hostel to get started."}
      </p>
    </div>
    {#if data.hostel}
      <Button
        label={refreshing ? "Refreshing…" : "Refresh plans"}
        variant="secondary"
        isDisabled={refreshing}
        xstyle={stayStyles.touch}
        onclick={async () => {
          refreshing = true;
          try {
            await invalidateAll();
          } finally {
            refreshing = false;
          }
        }}
      />
    {/if}
  </header>

  {#if !data.hostel}
    <Card padding={4}
      ><p {...sx(stayStyles.text)}>
        Choose a hostel to see its residents and departure plans.
      </p></Card
    >
  {:else}
    <dl {...sx(styles.metrics)}>
      <div {...sx(styles.metric)}>
        <dt {...sx(styles.label)}>Follow-ups due</dt>
        <dd {...sx(styles.value)}>{data.stats.dueForFollowUp}</dd>
      </div>
      <div {...sx(styles.metric)}>
        <dt {...sx(styles.label)}>Leaving in the next 7 days</dt>
        <dd {...sx(styles.value)}>{data.stats.leavingThisWeek}</dd>
      </div>
      <div {...sx(styles.metric)}>
        <dt {...sx(styles.label)}>Overdue plans</dt>
        <dd {...sx(styles.value)}>{data.stats.overduePlans}</dd>
      </div>
      <div {...sx(styles.metric)}>
        <dt {...sx(styles.label)}>Outstanding dues</dt>
        <dd {...sx(styles.value)}>
          {formatPaise(data.stats.outstandingPaise)}
        </dd>
      </div>
    </dl>
    <p {...sx(stayStyles.text)}>
      This hostel shows departure reminders {data.reminderDays} days ahead. A departure
      plan does not release a bed.
    </p>
    <div
      role="group"
      aria-label="Filter departure plans"
      {...sx(styles.filter)}
    >
      {#each filters as item}
        <button
          type="button"
          aria-pressed={filter === item.id}
          onclick={() => (filter = item.id)}
          {...sx([
            styles.filterButton,
            filter === item.id ? styles.selected : null,
          ])}>{item.label}</button
        >
      {/each}
    </div>
    <p role="status" {...sx(stayStyles.text)}>
      {items.length}
      {items.length === 1 ? "resident" : "residents"}
    </p>
    {#if items.length === 0}
      <Card padding={4}
        ><p {...sx(stayStyles.text)}>No residents match this filter.</p></Card
      >
    {:else}
      <div {...sx(stayStyles.stack)}>
        {#each items as item (JSON.stringify([scopeKey, item.agreementId]))}
          {@const removed = !activeAgreements.has(item.agreementId)}
          <Card
            role="article"
            aria-label={item.name}
            padding={4}
            xstyle={styles.card}
          >
            <div {...sx(styles.header)}>
              <div>
                <h2 {...sx(styles.titleSmall)}>{item.name}</h2>
                <p {...sx(stayStyles.text)}>
                  Room {item.roomNumber} · Bed {item.bedLabel} · {item.stayKind ===
                  "short"
                    ? "Short stay"
                    : "Long stay"}
                </p>
              </div>
              {#if !removed}<div {...sx(stayStyles.actions)}>
                <Badge
                  label={intentLabel[item.departureIntent]}
                  variant={item.departureIntent === "confirmed"
                    ? "success"
                    : "neutral"}
                />
                {#if item.daysUntilDeparture !== null && item.daysUntilDeparture < 0}<Badge
                    label="Overdue · Still occupied"
                    variant="error"
                  />{/if}
                {#if item.needsFollowUp}<Badge
                    label="Follow-up due"
                    variant="warning"
                  />{/if}
              </div>{/if}
            </div>
            {#if removed}
              <p role="status" {...sx(stayStyles.text)}>This stay is no longer on the active list. Your unsaved changes are still here; close the draft with Cancel.</p>
            {:else}
            <dl {...sx(styles.details)}>
              <div>
                <dt {...sx(styles.label)}>Planned departure</dt>
                <dd {...sx(styles.detailValue)}>
                  {item.expectedEndDate
                    ? formatDate(item.expectedEndDate)
                    : "Unknown"}
                </dd>
              </div>
              <div>
                <dt {...sx(styles.label)}>Last contacted</dt>
                <dd {...sx(styles.detailValue)}>
                  {item.lastContactedAt
                    ? formatDateTime(item.lastContactedAt)
                    : "Not recorded"}
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
              <div>
                <dt {...sx(styles.label)}>Outstanding dues</dt>
                <dd {...sx(styles.detailValue)}>
                  {formatPaise(item.outstandingPaise)}
                </dd>
              </div>
            </dl>
            {#if item.notes}<p {...sx(stayStyles.text)}>{item.notes}</p>{/if}
            <div {...sx(stayStyles.actions)}>
              {#if item.phone}<a
                  href={`tel:${item.phone.replace(/[^+0-9]/g, "")}`}
                  {...sx(styles.link)}>Call {item.phone}</a
                >{/if}
              <Button
                label="Resident profile"
                href={`/residents/${encodeURIComponent(item.residentId)}`}
                variant="secondary"
                xstyle={stayStyles.touch}
              />
            </div>
            {/if}
            {#if data.scope.role === "manager" || data.scope.role === "organization_admin"}
              <StayPlanEditor
                agreementId={item.agreementId}
                residentId={item.residentId}
                hostelId={item.hostelId}
                version={item.version}
                expectedEndDate={item.expectedEndDate}
                departureIntent={item.departureIntent}
                followUpDate={item.followUpDate}
                notes={item.notes}
                noLongerActive={removed}
                onEditingChange={(editing) => {
                  if (editing && !openDrafts.some(draft => draft.item.agreementId === item.agreementId)) {
                    openDrafts = [...openDrafts, { scope: scopeKey, item: { ...item } }];
                  } else if (!editing) {
                    openDrafts = openDrafts.filter(draft => draft.item.agreementId !== item.agreementId);
                  }
                }}
              />
            {/if}
          </Card>
        {/each}
      </div>
    {/if}
  {/if}
</div>
