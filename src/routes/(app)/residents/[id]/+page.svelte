<script lang="ts">
  import { enhance, feedback } from '$lib/api/forms';
  import { residentImageUrl } from '$lib/api/client';
  import { residentStatusLabel } from '$lib/api/contracts';
  import {
    Avatar,
    Badge,
    Button,
    Card,
    Dialog,
    DialogHeader,
    Heading,
    NumberInput,
    Selector,
    Tab,
    TabList,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHeaderCell,
    TableRow,
    Text,
    TextInput
  } from '@astryx-svelte/core';
  import { sx } from '$lib/design/attrs';
  import StayPlanEditor from '$lib/components/stays/StayPlanEditor.svelte';
  import { tableLayout } from '$lib/design/table.stylex';
  import { formatDate, formatDateTime, ordinalDay, todayInAppTimezone } from '$lib/formatters/date.js';
  import { formatPaise, formatPaiseCompact, paiseToRupees } from '$lib/formatters/money.js';
  import type { PageData } from './$types';
  import { styles } from './page.stylex';
  import AlertCircle from '@lucide/svelte/icons/alert-circle';

  let { data }: { data: PageData } = $props();
  let form = $derived($feedback);
  let canEditPlan = $derived(data.scope.role === 'manager' || data.scope.role === 'organization_admin');
  let readOnly = $derived(!canEditPlan);
  let portrait = $derived(readOnly ? undefined : residentImageUrl(data.resident.id, 'portrait', data.resident.portraitUrl));
  let identityDocument = $derived(readOnly ? undefined : residentImageUrl(data.resident.id, 'identity', data.resident.identityDocumentUrl));
  let brokenPortrait = $state<string>();

  let activeTab = $state('overview');
  let isEditDialogOpen = $state(false);
  let isPaymentDialogOpen = $state(false);
  let isCheckOutDialogOpen = $state(false);
  let selectedInvoiceId = $state('');
  let paymentAmountRupees = $state<number | null>(null);
  let paymentMethod = $state('upi');
  let paymentReference = $state('');
  let paymentNotes = $state('');
  let editName = $state('');
  let editPhone = $state('');
  let editEmail = $state('');
  let editEmergencyName = $state('');
  let editEmergencyPhone = $state('');
  let checkOutDate = $state(todayInAppTimezone());
  let checkOutNotes = $state('');

  function syncEditFields() {
    editName = data.resident.fullName;
    editPhone = data.resident.phone;
    editEmail = data.resident.email ?? '';
    editEmergencyName = data.resident.emergencyContactName ?? '';
    editEmergencyPhone = data.resident.emergencyContactPhone ?? '';
  }

  $effect(() => {
    if (!isEditDialogOpen) syncEditFields();
  });

  function openEditDialog() {
    syncEditFields();
    isEditDialogOpen = true;
  }

  const unpaidInvoices = $derived(
    data.invoices.filter(
      (invoice) =>
        invoice.status !== 'paid' && invoice.status !== 'void' && invoice.outstandingPaise > 0
    )
  );
  const invoiceOptions = $derived(
    unpaidInvoices.map((invoice) => ({
      value: invoice.id,
      label: `${invoice.invoiceNumber} — Outstanding: ${formatPaise(invoice.outstandingPaise)}`
    }))
  );
  const paymentMethodOptions = [
    { value: 'upi', label: 'UPI (GPay / PhonePe / Paytm)' },
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer (NEFT / IMPS)' },
    { value: 'card', label: 'Debit / Credit Card' },
    { value: 'other', label: 'Other' }
  ];

  function openPaymentDialog(invoiceId?: string) {
    const invoice = invoiceId
      ? data.invoices.find((item) => item.id === invoiceId)
      : unpaidInvoices[0];
    selectedInvoiceId = invoice?.id ?? '';
    paymentAmountRupees = invoice ? paiseToRupees(invoice.outstandingPaise) : null;
    paymentMethod = 'upi';
    paymentReference = '';
    paymentNotes = '';
    isPaymentDialogOpen = true;
  }

  function selectInvoice(invoiceId: string) {
    selectedInvoiceId = invoiceId;
    const invoice = data.invoices.find((item) => item.id === invoiceId);
    paymentAmountRupees = invoice ? paiseToRupees(invoice.outstandingPaise) : null;
  }

  function formatActionLabel(action: string) {
    return action
      .replace(/_/g, ' ')
      .replace(/\./g, ' — ')
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }
</script>

<svelte:head><title>{data.resident.fullName} — Resident Detail — EasyPG</title></svelte:head>

<div {...sx(styles.page)}>
  <a href="/residents" {...sx(styles.breadcrumb)}>← Residents</a>

  {#if form?.message && !form?.success}
    <div {...sx(styles.pageFeedback)} role="alert">
      <AlertCircle size={17} /><span>{form.message}</span>
    </div>
  {/if}

  <Card padding={5} xstyle={styles.profile}>
    <div {...sx(styles.profileIdentity)}>
      {#if portrait && portrait !== brokenPortrait}
        <img src={portrait} alt="Resident portrait" referrerpolicy="no-referrer" onerror={() => (brokenPortrait = portrait)} {...sx(styles.savedPortrait)} />
      {:else}
        <Avatar name={data.resident.fullName} size="lg" tooltip={false} />
      {/if}
      <div {...sx(styles.profileCopy)}>
        <div {...sx(styles.profileTitle)}>
          <Heading level={1} xstyle={styles.fullName}>{data.resident.fullName}</Heading><Badge
            label={data.resident.status === 'active' ? 'Active tenancy' : residentStatusLabel[data.resident.status]}
            variant={data.resident.status === 'active' ? 'success' : 'neutral'}
          />
        </div>
        <div {...sx(styles.profileDetails)}>
          <span>{data.resident.phone}</span>{#if data.resident.email}<span
              >{data.resident.email}</span
            >{/if}{#if data.resident.room}<span
              >Room {data.resident.room.roomNumber}{#if data.resident.bed}
                ({data.resident.bed.bedLabel}){/if}{#if data.location.floorLabel}
                · {data.location.floorLabel}{/if}</span
            >{/if}
        </div>
      </div>
    </div>
    {#if !readOnly}
    <div {...sx(styles.profileActions)}>
      {#if data.resident.status === 'registered'}
        <Button label="Assign bed" xstyle={styles.touchButton} href={`/check-ins?residentId=${encodeURIComponent(data.resident.id)}`} variant="primary" />
      {/if}
      {#if identityDocument}
        <a href={identityDocument} target="_blank" rel="noopener noreferrer" {...sx(styles.documentLink)}>View identity document</a>
      {/if}
      <Button label="Edit profile" xstyle={styles.touchButton} variant="secondary" onclick={openEditDialog} />
      {#if unpaidInvoices.length > 0}<Button
          label="Record payment"
          xstyle={styles.touchButton}
          variant="primary"
          onclick={() => openPaymentDialog()}
        />{/if}
      {#if data.resident.status === 'active'}<Button
          label="Check out"
          variant="ghost"
          xstyle={[styles.checkoutAction, styles.touchButton]}
          onclick={() => {
            checkOutDate = todayInAppTimezone();
            isCheckOutDialogOpen = true;
          }}
        />{/if}
    </div>
    {/if}
  </Card>

  <section {...sx(styles.tabs)}>
    <TabList value={activeTab} onChange={(value) => (activeTab = value)} role="tablist" hasDivider>
      <Tab
        id="resident-overview-tab"
        value="overview"
        label="Overview"
        panelId="resident-overview"
      />
      <Tab
        id="resident-invoices-tab"
        value="invoices"
        label={`Invoices (${data.invoices.length})`}
        panelId="resident-invoices"
      />
      <Tab
        id="resident-payments-tab"
        value="payments"
        label={`Payments (${data.payments.length})`}
        panelId="resident-payments"
      />
      <Tab
        id="resident-history-tab"
        value="history"
        label={`Activity (${data.activityTimeline.length})`}
        panelId="resident-history"
      />
    </TabList>

    <div
      id="resident-overview"
      role="tabpanel"
      aria-labelledby="resident-overview-tab"
      hidden={activeTab !== 'overview'}
      {...sx(styles.tabPanel)}
    >
      <div {...sx(styles.overviewGrid)}>
        <Card padding={4} xstyle={styles.cardStack}>
          <div {...sx(styles.cardTitle)}>
            <Heading level={2}>Tenancy agreement</Heading>{#if data.resident.activeAgreement}<Badge
                label={data.resident.activeAgreement.status.toUpperCase()}
                variant="success"
              />{/if}
          </div>
          {#if data.resident.activeAgreement}
            <dl {...sx(styles.terms)}>
              <div {...sx(styles.term)}>
                <dt {...sx(styles.termLabel)}>Rate plan</dt>
                <dd {...sx(styles.termValue)}>{data.resident.ratePlan?.name ?? 'Standard plan'}</dd>
              </div>
              <div {...sx(styles.term)}>
                <dt {...sx(styles.termLabel)}>Agreed {data.resident.activeAgreement.billingPeriod === 'day' ? 'daily' : 'monthly'} rent</dt>
                <dd {...sx(styles.termValue)}>
                  {formatPaise(data.resident.activeAgreement.agreedRentPaise)}
                </dd>
              </div>
              <div {...sx(styles.term)}>
                <dt {...sx(styles.termLabel)}>Security deposit</dt>
                <dd {...sx(styles.termValue)}>
                  {formatPaise(data.resident.activeAgreement.agreedDepositPaise)}
                </dd>
              </div>
              <div {...sx(styles.term)}>
                <dt {...sx(styles.termLabel)}>Billing cycle</dt>
                <dd {...sx(styles.termValue)}>
                  {#if data.resident.activeAgreement.billingPeriod === 'day'}Per day{:else}{ordinalDay(data.resident.activeAgreement.billingDay)} of each month{/if}
                </dd>
              </div>
              <div {...sx(styles.term)}>
                <dt {...sx(styles.termLabel)}>Tenancy start</dt>
                <dd {...sx(styles.termValue)}>
                  {formatDate(data.resident.activeAgreement.startDate)}
                </dd>
              </div>
              <div {...sx(styles.term)}>
                <dt {...sx(styles.termLabel)}>Expected end</dt>
                <dd {...sx(styles.termValue)}>
                  {data.resident.activeAgreement.expectedEndDate
                    ? formatDate(data.resident.activeAgreement.expectedEndDate)
                    : 'Unknown'}
                  {#if data.resident.activeAgreement.expectedEndDate && data.resident.activeAgreement.departureIntent} · {data.resident.activeAgreement.departureIntent}{/if}
                </dd>
              </div>
              <div {...sx(styles.term)}>
                <dt {...sx(styles.termLabel)}>Next follow-up</dt>
                <dd {...sx(styles.termValue)}>{data.resident.activeAgreement.followUpDate ? formatDate(data.resident.activeAgreement.followUpDate) : 'Not scheduled'}</dd>
              </div>
              <div {...sx(styles.term)}>
                <dt {...sx(styles.termLabel)}>Last contacted</dt>
                <dd {...sx(styles.termValue)}>{data.resident.activeAgreement.lastContactedAt ? formatDateTime(data.resident.activeAgreement.lastContactedAt) : 'Not recorded'}</dd>
              </div>
            </dl>
            {#if data.resident.activeAgreement.departureNotes}
              <Text as="p" type="supporting">{data.resident.activeAgreement.departureNotes}</Text>
            {/if}
            {#if canEditPlan && data.scope.activeHostelId && data.resident.activeAgreement.version !== undefined}
              {#key data.resident.activeAgreement.id}
                <StayPlanEditor
                  agreementId={data.resident.activeAgreement.id}
                  residentId={data.resident.id}
                  hostelId={data.scope.activeHostelId}
                  version={data.resident.activeAgreement.version}
                  expectedEndDate={data.resident.activeAgreement.expectedEndDate}
                  departureIntent={data.resident.activeAgreement.departureIntent ?? (data.resident.activeAgreement.expectedEndDate ? 'tentative' : 'unknown')}
                  followUpDate={data.resident.activeAgreement.followUpDate ?? null}
                  notes={data.resident.activeAgreement.departureNotes ?? ''}
                />
              {/key}
            {/if}
          {:else}<Text as="p" type="supporting"
              >No active tenancy agreement found for this resident.</Text
            >{/if}
        </Card>

        <Card padding={4} xstyle={styles.cardStack}>
          <div {...sx(styles.cardTitle)}><Heading level={2}>Financial summary</Heading></div>
          <div {...sx(styles.financeGrid)}>
            <span {...sx(styles.financeMetric)}
              ><Text as="span" type="supporting">Billed</Text><strong {...sx(styles.metricValue)}
                >{formatPaiseCompact(data.financialSummary.totalBilledPaise)}</strong
              ></span
            >
            <span {...sx(styles.financeMetric)}
              ><Text as="span" type="supporting">Paid</Text><strong
                {...sx([styles.metricValue, styles.success])}
                >{formatPaiseCompact(data.financialSummary.totalPaidPaise)}</strong
              ></span
            >
            <span {...sx(styles.financeMetric)}
              ><Text as="span" type="supporting">Outstanding</Text><strong
                {...sx([
                  styles.metricValue,
                  data.financialSummary.totalOutstandingPaise > 0 ? styles.warning : styles.numeric
                ])}>{formatPaiseCompact(data.financialSummary.totalOutstandingPaise)}</strong
              ></span
            >
          </div>
          <div {...sx(styles.notice)}>
            {#if unpaidInvoices.length > 0}<span {...sx(styles.noticeCopy)}
                ><Text as="span" weight="bold"
                  >{unpaidInvoices.length} unpaid {unpaidInvoices.length === 1
                    ? 'invoice'
                    : 'invoices'}</Text
                ><Text as="span" type="supporting">Payment is due against the open balance.</Text
                ></span
              >{#if !readOnly}<Button
                label="Pay now"
                size="sm"
                variant="primary"
                onclick={() => openPaymentDialog()}
                xstyle={styles.touchButton}
              />{/if}{:else}<Text as="span" xstyle={styles.success}>All dues are cleared.</Text>{/if}
          </div>
        </Card>
      </div>
      <Card padding={4} xstyle={styles.cardStack}>
        <div {...sx(styles.cardTitle)}><Heading level={2}>Emergency contact</Heading></div>
        {#if data.resident.emergencyContactName || data.resident.emergencyContactPhone}<dl
            {...sx(styles.terms)}
          >
            <div {...sx(styles.term)}>
              <dt {...sx(styles.termLabel)}>Contact name</dt>
              <dd {...sx(styles.termValue)}>
                {data.resident.emergencyContactName || 'Not provided'}
              </dd>
            </div>
            <div {...sx(styles.term)}>
              <dt {...sx(styles.termLabel)}>Contact phone</dt>
              <dd {...sx([styles.termValue, styles.mono])}>
                {data.resident.emergencyContactPhone || 'Not provided'}
              </dd>
            </div>
          </dl>{:else}<Text as="p" type="supporting">No emergency contact details registered.</Text
          >{/if}
      </Card>
    </div>
    <div
      id="resident-invoices"
      role="tabpanel"
      aria-labelledby="resident-invoices-tab"
      hidden={activeTab !== 'invoices'}
      {...sx(styles.tabPanel)}
    >
      {#if data.invoices.length === 0}<Card padding={6} xstyle={styles.empty}
          ><Heading level={2}>No invoices generated yet</Heading><Text as="p" type="supporting"
            >Monthly invoices will appear here.</Text
          ></Card
        >{:else}
        <div {...sx([styles.tableWrap, tableLayout.inset])}>
          <Table density="compact" dividers="rows" xstyle={styles.invoiceTable}
            ><TableHeader
              ><TableRow isHeaderRow
                ><TableHeaderCell scope="col">Invoice #</TableHeaderCell><TableHeaderCell
                  scope="col">Period</TableHeaderCell
                ><TableHeaderCell scope="col">Due date</TableHeaderCell><TableHeaderCell scope="col"
                  >Total</TableHeaderCell
                ><TableHeaderCell scope="col">Paid</TableHeaderCell><TableHeaderCell scope="col"
                  >Outstanding</TableHeaderCell
                ><TableHeaderCell scope="col">Status</TableHeaderCell><TableHeaderCell scope="col"
                  >Action</TableHeaderCell
                ></TableRow
              ></TableHeader
            ><TableBody
              >{#each data.invoices as invoice (invoice.id)}<TableRow
                  ><TableCell
                    ><Text as="span" xstyle={[styles.mono, styles.numeric]}
                      >{invoice.invoiceNumber}</Text
                    ></TableCell
                  ><TableCell
                    ><Text as="span" xstyle={styles.metadata}
                      >{formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}</Text
                    ></TableCell
                  ><TableCell
                    ><Text as="span" xstyle={styles.metadata}>{formatDate(invoice.dueDate)}</Text
                    ></TableCell
                  ><TableCell
                    ><Text as="span" xstyle={styles.numeric}>{formatPaise(invoice.totalPaise)}</Text
                    ></TableCell
                  ><TableCell
                    ><Text as="span" xstyle={[styles.numeric, styles.success]}
                      >{formatPaise(invoice.paidPaise)}</Text
                    ></TableCell
                  ><TableCell
                    ><Text
                      as="span"
                      xstyle={[
                        styles.numeric,
                        invoice.outstandingPaise > 0 ? styles.warning : styles.metadata
                      ]}>{formatPaise(invoice.outstandingPaise)}</Text
                    ></TableCell
                  ><TableCell
                    ><Badge
                      label={invoice.status === 'partially_paid' ? 'Partial' : invoice.status}
                      variant={invoice.status === 'paid'
                        ? 'success'
                        : invoice.status === 'overdue'
                          ? 'error'
                          : invoice.status === 'partially_paid'
                            ? 'warning'
                            : 'info'}
                    /></TableCell
                  ><TableCell
                    >{#if !readOnly && invoice.outstandingPaise > 0}<Button
                        label="Record pay"
                        size="sm"
                        xstyle={styles.touchButton}
                        variant="secondary"
                        onclick={() => openPaymentDialog(invoice.id)}
                      />{:else}<Text as="span" type="supporting">{invoice.outstandingPaise > 0 ? '—' : 'Cleared'}</Text>{/if}</TableCell
                  ></TableRow
                >{/each}</TableBody
            ></Table
          >
        </div>
      {/if}
    </div>
    <div
      id="resident-payments"
      role="tabpanel"
      aria-labelledby="resident-payments-tab"
      hidden={activeTab !== 'payments'}
      {...sx(styles.tabPanel)}
    >
      {#if data.payments.length === 0}<Card padding={6} xstyle={styles.empty}
          ><Heading level={2}>No payments recorded yet</Heading><Text as="p" type="supporting"
            >Recorded payments will show up here.</Text
          ></Card
        >{:else}
        <div {...sx([styles.tableWrap, tableLayout.inset])}>
          <Table density="compact" dividers="rows" xstyle={styles.paymentTable}
            ><TableHeader
              ><TableRow isHeaderRow
                ><TableHeaderCell scope="col">Received at</TableHeaderCell><TableHeaderCell
                  scope="col">Method</TableHeaderCell
                ><TableHeaderCell scope="col">Reference</TableHeaderCell><TableHeaderCell
                  scope="col">Amount</TableHeaderCell
                ><TableHeaderCell scope="col">Status</TableHeaderCell><TableHeaderCell scope="col"
                  >Notes</TableHeaderCell
                ></TableRow
              ></TableHeader
            ><TableBody
              >{#each data.payments as payment (payment.id)}<TableRow
                  ><TableCell
                    ><Text as="span" xstyle={styles.metadata}
                      >{formatDateTime(payment.receivedAt)}</Text
                    ></TableCell
                  ><TableCell
                    ><Text as="span" xstyle={styles.numeric}
                      >{payment.paymentMethod.replace(/_/g, ' ')}</Text
                    ></TableCell
                  ><TableCell
                    ><Text as="span" xstyle={[styles.mono, styles.metadata]}
                      >{payment.reference || '—'}</Text
                    ></TableCell
                  ><TableCell
                    ><Text as="span" xstyle={[styles.numeric, styles.success]}
                      >{formatPaise(payment.amountPaise)}</Text
                    ></TableCell
                  ><TableCell><Badge label={payment.status} variant="success" /></TableCell
                  ><TableCell
                    ><Text as="span" xstyle={styles.noteCell}>{payment.notes || '—'}</Text
                    ></TableCell
                  ></TableRow
                >{/each}</TableBody
            ></Table
          >
        </div>
      {/if}
    </div>
    <div
      id="resident-history"
      role="tabpanel"
      aria-labelledby="resident-history-tab"
      hidden={activeTab !== 'history'}
      {...sx(styles.tabPanel)}
    >
      {#if data.activityTimeline.length === 0}<Card padding={6} xstyle={styles.empty}
          ><Heading level={2}>No recent activity</Heading><Text as="p" type="supporting"
            >Audit log entries will appear here.</Text
          ></Card
        >{:else}
        <Card padding={5}
          ><div {...sx(styles.timeline)}>
            {#each data.activityTimeline as event (event.id)}<article {...sx(styles.event)}>
                <i {...sx(styles.dot)}></i>
                <div {...sx(styles.eventHeader)}>
                  <Text as="span" weight="bold">{formatActionLabel(event.action)}</Text><Text
                    as="span"
                    type="supporting">{formatDateTime(event.createdAt)}</Text
                  >
                </div>
                {#if Object.keys(event.metadata).length > 0}<pre
                    {...sx(styles.eventJson)}>{JSON.stringify(event.metadata, null, 2)}</pre>{/if}
              </article>{/each}
          </div></Card
        >
      {/if}
    </div>
  </section>
</div>

{#if !readOnly}
<Dialog
  isOpen={isEditDialogOpen}
  onOpenChange={(open) => (isEditDialogOpen = open)}
  purpose="form"
  width="560px"
>
  <DialogHeader
    title="Edit resident profile"
    subtitle="Update contact details and emergency information."
    onOpenChange={(open) => (isEditDialogOpen = open)}
  />
  <form
    method="POST"
    data-operation="updateResident"
    data-resource-id={data.resident.id}
    use:enhance={() =>
      async ({ result, update }) => {
        if (result.type === 'success') isEditDialogOpen = false;
        await update({ reset: false });
      }}
    {...sx(styles.dialogBody)}
  >
    {#if form?.message && !form?.success}
      <div {...sx(styles.feedbackError)} role="alert">
        <AlertCircle size={17} /><span>{form.message}</span>
      </div>
    {/if}
    <div {...sx(styles.formGrid)}>
      <TextInput
        label="Full name"
        bind:value={editName}
        htmlName="fullName"
        isRequired
        xstyle={styles.fullField}
      />
      <TextInput
        label="Phone number"
        bind:value={editPhone}
        htmlName="phone"
        isRequired
      />
      <TextInput
        label="Email address"
        type="email"
        bind:value={editEmail}
        htmlName="email"
      />
      <TextInput
        label="Emergency contact name"
        bind:value={editEmergencyName}
        htmlName="emergencyContactName"
      />
      <TextInput
        label="Emergency contact phone"
        bind:value={editEmergencyPhone}
        htmlName="emergencyContactPhone"
      />
    </div>
    <footer {...sx(styles.dialogActions)}>
      <Button
        label="Cancel"
        variant="secondary"
        onclick={() => (isEditDialogOpen = false)}
      /><Button label="Save changes" type="submit" variant="primary" />
    </footer>
  </form>
</Dialog>

<Dialog
  isOpen={isPaymentDialogOpen}
  onOpenChange={(open) => (isPaymentDialogOpen = open)}
  purpose="form"
  width="520px"
>
  <DialogHeader
    title="Record payment"
    subtitle="Record a receipt against an outstanding invoice."
    onOpenChange={(open) => (isPaymentDialogOpen = open)}
  />
  <form
    method="POST"
    data-operation="recordPayment"
    data-resource-id={data.resident.id}
    use:enhance={() =>
      async ({ result, update }) => {
        if (result.type === 'success') isPaymentDialogOpen = false;
        await update({ reset: false });
      }}
    {...sx(styles.dialogBody)}
  >
    {#if form?.message && !form?.success}
      <div {...sx(styles.feedbackError)} role="alert">
        <AlertCircle size={17} /><span>{form.message}</span>
      </div>
    {/if}
    <Selector
      label="Target invoice"
      options={invoiceOptions}
      htmlName="invoiceId"
      value={selectedInvoiceId}
      onChange={(value: string | null) => selectInvoice(value ?? '')}
      placeholder="Select invoice…"
      isRequired
    />
    <NumberInput
      label="Payment amount (₹)"
      htmlName="amountRupees"
      value={paymentAmountRupees}
      onChange={(value: number | null) => (paymentAmountRupees = value)}
      min={0.01}
      step={0.01}
      placeholder="8500"
      isRequired
    />
    <Selector
      label="Payment method"
      options={paymentMethodOptions}
      htmlName="paymentMethod"
      value={paymentMethod}
      onChange={(value: string | null) => (paymentMethod = value ?? 'upi')}
      isRequired
    />
    <TextInput
      label="Reference / UTR number"
      isOptional
      value={paymentReference}
      onChange={(value) => (paymentReference = value)}
      htmlName="reference"
      placeholder="UPI-123456789"
    />
    <TextInput
      label="Notes"
      isOptional
      value={paymentNotes}
      onChange={(value) => (paymentNotes = value)}
      htmlName="notes"
      placeholder="Paid in full for August"
    />
    <footer {...sx(styles.dialogActions)}>
      <Button
        label="Cancel"
        variant="secondary"
        onclick={() => (isPaymentDialogOpen = false)}
      /><Button label="Confirm payment" type="submit" variant="primary" />
    </footer>
  </form>
</Dialog>

<Dialog
  isOpen={isCheckOutDialogOpen}
  onOpenChange={(open) => (isCheckOutDialogOpen = open)}
  purpose="form"
  width="480px"
>
  <DialogHeader
    title="Check out resident"
    subtitle={`End tenancy for ${data.resident.fullName}, release their bed, and close the active agreement.`}
    onOpenChange={(open) => (isCheckOutDialogOpen = open)}
  />
  <form
    method="POST"
    data-operation="checkOut"
    data-resource-id={data.resident.id}
    use:enhance={() =>
      async ({ result, update }) => {
        if (result.type === 'success') isCheckOutDialogOpen = false;
        await update({ reset: false });
      }}
    {...sx(styles.dialogBody)}
  >
    {#if form?.message && !form?.success}
      <div {...sx(styles.feedbackError)} role="alert">
        <AlertCircle size={17} /><span>{form.message}</span>
      </div>
    {/if}
    <label {...sx(styles.dateField)}>
            <span {...sx(styles.dateLabel)}>Check-out date · Required (today or earlier)</span>
            <input type="date" name="checkOutDate" max={todayInAppTimezone()} bind:value={checkOutDate} required {...sx(styles.dateInput)} />
          </label>
    <TextInput
      label="Reason / notes"
      isOptional
      value={checkOutNotes}
      onChange={(value) => (checkOutNotes = value)}
      htmlName="notes"
      placeholder="Relocation, tenancy end…"
    />
    <footer {...sx(styles.dialogActions)}>
      <Button
        label="Cancel"
        variant="secondary"
        onclick={() => (isCheckOutDialogOpen = false)}
      /><Button label="Confirm check-out" type="submit" variant="destructive" />
    </footer>
  </form>
</Dialog>

{/if}
