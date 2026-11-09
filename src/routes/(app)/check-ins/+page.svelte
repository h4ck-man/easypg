<script lang="ts">
  import { enhance, type Feedback } from "$lib/api/forms";
  import type { StayKind } from "$lib/api/contracts";
  import { stayStyles } from "$lib/components/stays/stay.stylex";
  import type { PageData } from "./$types";
  import {
    Button,
    Card,
    NumberInput,
    Selector,
    Badge,
    TextInput,
  } from "@astryx-svelte/core";
  import { sx } from "$lib/design/attrs";
  import { styles } from "./page.stylex";
  import { todayInAppTimezone } from "$lib/formatters/date";
  import { formatPaise, paiseToRupees } from "$lib/formatters/money.js";
  import LogIn from "@lucide/svelte/icons/log-in";
  import AlertCircle from "@lucide/svelte/icons/alert-circle";

  let { data }: { data: PageData } = $props();
  let form = $state<Feedback | null>(null);

  let selectedRoomId = $state("");
  $effect(() => {
    handleRoomChange(data.preselectedRoomId ?? "");
  });
  let selectedBedId = $state("");
  let selectedRatePlanId = $state("");
  let fullName = $state("");
  let phone = $state("");
  let email = $state("");
  let gender = $state("");
  let stayKind = $state<StayKind>("long");
  let acFilter = $state("");
  let sharingFilter = $state("");
  let expectedEndDate = $state("");
  let followUpDate = $state("");
  let period = $derived(stayKind === "short" ? "day" : "month");
  let genderPolicy = $derived(data.hostel?.genderPolicy ?? "unspecified");
  let registeredGender = $derived(
    data.registeredResident?.gender || "undisclosed",
  );
  let selectedPlan = $derived(
    data.ratePlans.find((plan) => plan.id === selectedRatePlanId),
  );
  let expectedHostelId = $state("");
  $effect(() => {
    const id = data.hostel?.id ?? "";
    if (expectedHostelId === id) return;
    expectedHostelId = id;
    handleRoomChange(data.preselectedRoomId ?? "");
    fullName = "";
    phone = "";
    email = "";
    gender = genderPolicy === "unspecified" ? "undisclosed" : "";
    stayKind = "long";
    acFilter = "";
    sharingFilter = "";
    expectedEndDate = "";
    followUpDate = "";
    billingDay = 1;
    checkInDate = todayInAppTimezone();
    form = null;
  });
  let rentRupees = $state<number | null>(null);
  let depositRupees = $state<number | null>(null);
  let billingDay = $state<number | null>(1);
  let checkInDate = $state(todayInAppTimezone());
  let isSubmitting = $state(false);

  let filteredBeds = $derived(
    data.availableBeds.filter(
      (bed) => !selectedRoomId || bed.roomId === selectedRoomId,
    ),
  );
  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
    { value: "undisclosed", label: "Undisclosed" },
  ];
  let roomOptions = $derived(
    data.rooms
      .filter(
        (room) =>
          (!acFilter || room.acType === acFilter) &&
          (!sharingFilter || String(room.standardCapacity) === sharingFilter) &&
          data.ratePlans.some(
            (plan) =>
              plan.roomTypeId === room.roomTypeId &&
              (plan.billingPeriod ?? "month") === period,
          ),
      )
      .map((room) => ({
        value: room.id,
        label: `Room ${room.roomNumber} — ${room.roomTypeName} (${room.standardCapacity} beds · ${room.acType === "ac" ? "AC" : "Non-AC"})`,
      })),
  );
  let bedOptions = $derived(
    filteredBeds.map((bed) => ({ value: bed.id, label: bed.bedLabel })),
  );
  let ratePlanOptions = $derived(
    data.ratePlans
      .filter((plan) => {
        const selectedRoom = data.rooms.find(
          (room) => room.id === selectedRoomId,
        );
        return (
          (plan.billingPeriod ?? "month") === period &&
          selectedRoom?.roomTypeId === plan.roomTypeId
        );
      })
      .map((plan) => ({
        value: plan.id,
        label: `${plan.name} — ${formatPaise(plan.rentPaise)}/${plan.billingPeriod ?? "month"} (Deposit: ${formatPaise(plan.depositPaise)})`,
      })),
  );

  function handleRatePlanChange(ratePlanId: string) {
    selectedRatePlanId = ratePlanId;
    const plan = data.ratePlans.find((item) => item.id === ratePlanId);
    if (plan) {
      rentRupees = paiseToRupees(plan.rentPaise);
      depositRupees = paiseToRupees(plan.depositPaise);
    } else {
      rentRupees = null;
      depositRupees = null;
    }
  }

  function setDuration(unit: "days" | "months" | "unknown", amount = 0) {
    if (unit === "unknown" || !checkInDate) {
      expectedEndDate = "";
      return;
    }
    const date = new Date(`${checkInDate}T00:00:00Z`);
    if (unit === "days") date.setUTCDate(date.getUTCDate() + amount);
    else {
      const day = date.getUTCDate();
      date.setUTCDate(1);
      date.setUTCMonth(date.getUTCMonth() + amount);
      const lastDay = new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
      ).getUTCDate();
      date.setUTCDate(Math.min(day, lastDay));
    }
    expectedEndDate = date.toISOString().slice(0, 10);
  }

  function handleRoomChange(roomId: string) {
    selectedRoomId = roomId;
    selectedBedId = "";
    selectedRatePlanId = "";
    rentRupees = null;
    depositRupees = null;
  }
</script>

<svelte:head><title>Check In Resident — EasyPG</title></svelte:head>

<div {...sx(styles.page)}>
  <div {...sx(styles.heading)}>
    <div>
      <p {...sx(styles.eyebrow)}>Arrivals</p>
      <h1 {...sx(styles.title)}>Check In Resident</h1>
      <p {...sx(styles.description)}>
        Welcome a new resident. Add their details, choose a space, and confirm
        their stay.
      </p>
    </div>
    {#if data.hostel}
      <Badge
        variant="neutral"
        label={`${data.hostel.name} (${data.hostel.code})`}
      />
    {/if}
  </div>

  {#if form?.message}
    <div
      {...sx(form.success ? styles.feedbackSuccess : styles.feedbackError)}
      role={form.success ? "status" : "alert"}
    >
      <AlertCircle size={18} />
      <div>
        <span>{form.message}</span>
        {#if form.fieldErrors && Object.keys(form.fieldErrors).length}
          <ul {...sx(styles.fieldErrors)}>
            {#each Object.values(form.fieldErrors) as detail}<li>
                {detail}
              </li>{/each}
          </ul>
        {/if}
      </div>
    </div>
  {/if}

  {#if !data.hostel || data.availableBeds.length === 0 || (data.registeredResident && data.registeredResident.status !== "registered")}
    <Card xstyle={styles.card}>
      <h2 {...sx(styles.cardTitle)}>
        {!data.hostel
          ? "Choose a hostel first"
          : data.availableBeds.length === 0
            ? "No beds available"
            : "This resident is no longer awaiting a bed"}
      </h2>
      <Button
        xstyle={stayStyles.touch}
        label={data.hostel ? "Back to residents" : "View hostels"}
        href={data.hostel ? "/residents" : "/hostels"}
        variant="secondary"
      />
    </Card>
  {:else}
    <form
      method="POST"
      data-operation="checkIn"
      aria-label="Check-in form"
      {...sx(styles.form)}
      use:enhance={() => {
        isSubmitting = true;
        form = null;
        return async ({ result, update }) => {
          try {
            await update({ reset: false });
            if (result.type === "success" || result.type === "failure")
              form = result.data;
          } finally {
            isSubmitting = false;
          }
        };
      }}
    >
      <input type="hidden" name="expectedHostelId" value={expectedHostelId} />
      <input
        type="hidden"
        name="departureIntent"
        value={expectedEndDate ? "tentative" : "unknown"}
      />
      {#if period === "day"}<input
          type="hidden"
          name="billingDay"
          value="1"
        />{/if}
      {#if data.registeredResident}
        <input
          type="hidden"
          name="residentId"
          value={data.registeredResident.id}
        />
        <Card xstyle={styles.card}>
          <h2 {...sx(styles.cardTitle)}>{data.registeredResident.fullName}</h2>
          <p {...sx(styles.cardDescription)}>
            {data.registeredResident.phone} · Registered
          </p>
          <p {...sx(styles.cardDescription)}>
            Hostel admission policy: {genderPolicy === "unspecified"
              ? "No gender specified"
              : genderPolicy === "male"
                ? "Male residents"
                : "Female residents"}.
          </p>
          {#if registeredGender === "undisclosed"}
            <Selector
              label="Gender"
              htmlName="gender"
              options={genderOptions}
              value={gender}
              onChange={(value: string) => (gender = value)}
              placeholder="Select declared gender"
              isRequired
            />
          {:else}
            <p {...sx(styles.cardDescription)}>
              Declared gender: {registeredGender}.
            </p>
          {/if}
        </Card>
      {:else}
        <Card xstyle={styles.card}>
          <div {...sx(styles.cardHeader)}>
            <div {...sx(styles.stepLine)}>
              <span {...sx(styles.step)}>01</span>
              <h2 {...sx(styles.cardTitle)}>Resident Information</h2>
            </div>
            <p {...sx(styles.cardDescription)}>
              Enter primary contact and identity details.
            </p>
            <p {...sx(styles.cardDescription)}>
              Hostel admission policy: {genderPolicy === "unspecified"
                ? "No gender specified"
                : genderPolicy === "male"
                  ? "Male residents"
                  : "Female residents"}.
            </p>
          </div>
          <div {...sx(styles.fieldGrid)}>
            <TextInput
              label="Full Name"
              htmlName="fullName"
              placeholder="e.g. Rahul Sharma"
              value={fullName}
              onChange={(value) => (fullName = value)}
              isRequired
            />
            <!-- Phone uses a native telephone input because Astryx TextInput deliberately supports text, email, and password only. -->
            <div {...sx(styles.nativeField)}>
              <label for="phone" {...sx(styles.nativeLabel)}
                >Phone Number <span aria-hidden="true">*</span></label
              >
              <input
                id="phone"
                name="phone"
                type="tel"
                inputmode="tel"
                autocomplete="tel"
                placeholder="e.g. 9876543210"
                value={phone}
                oninput={(event) =>
                  (phone = (event.currentTarget as HTMLInputElement).value)}
                required
                {...sx(styles.nativeInput)}
              />
            </div>
            <TextInput
              label="Email Address"
              type="email"
              htmlName="email"
              placeholder="e.g. rahul@example.com"
              value={email}
              onChange={(value: string) => (email = value)}
            />
            <Selector
              label="Gender"
              options={genderOptions}
              htmlName="gender"
              placeholder="Select declared gender"
              value={gender}
              onChange={(value: string) => (gender = value)}
              isRequired
            />
          </div>
        </Card>
      {/if}

      <Card xstyle={styles.card}>
        <div {...sx(styles.cardHeader)}>
          <div {...sx(styles.stepLine)}>
            <span {...sx(styles.step)}>02</span>
            <h2 {...sx(styles.cardTitle)}>Room &amp; Bed Allocation</h2>
          </div>
          <p {...sx(styles.cardDescription)}>
            Select the target room and available bed.
          </p>
        </div>
        <div {...sx(styles.fieldGrid)}>
          <label {...sx(stayStyles.field)}>
            Stay type
            <select
              name="stayKind"
              bind:value={stayKind}
              onchange={() => handleRoomChange("")}
              {...sx(stayStyles.control)}
            >
              <option value="short">Short stay · per day</option>
              <option value="long">Long stay · per month</option>
            </select>
          </label>
          <label {...sx(stayStyles.field)}>
            AC filter
            <select
              bind:value={acFilter}
              onchange={() => handleRoomChange("")}
              {...sx(stayStyles.control)}
            >
              <option value="">Any AC type</option>
              <option value="ac">AC</option>
              <option value="non_ac">Non-AC</option>
            </select>
          </label>
          <label {...sx(stayStyles.field)}>
            Sharing filter
            <select
              bind:value={sharingFilter}
              onchange={() => handleRoomChange("")}
              {...sx(stayStyles.control)}
            >
              <option value="">Any sharing</option>
              <option value="1">1 bed / private</option>
              <option value="2">2 sharing</option>
              <option value="3">3 sharing</option>
              <option value="4">4 sharing</option>
            </select>
          </label>
          {#if roomOptions.length === 0}
            <p role="status" {...sx(styles.cardDescription)}>
              No rooms match these filters with a per-{period} rate.
            </p>
          {/if}
          <Selector
            label="Room"
            options={roomOptions}
            htmlName="roomId"
            value={selectedRoomId}
            onChange={handleRoomChange}
            isRequired
            placeholder="Select a room"
          />
          <Selector
            label="Bed"
            options={bedOptions}
            htmlName="bedId"
            value={selectedBedId}
            onChange={(value: string) => (selectedBedId = value)}
            isRequired
            placeholder="Select an available bed"
            isDisabled={!selectedRoomId}
          />
          {#if selectedRoomId && filteredBeds.length === 0}
            <p role="status" {...sx(styles.cardDescription)}>
              This room has no available beds. Choose another room.
            </p>
          {/if}
        </div>
      </Card>

      <Card xstyle={styles.card}>
        <div {...sx(styles.cardHeader)}>
          <div {...sx(styles.stepLine)}>
            <span {...sx(styles.step)}>03</span>
            <h2 {...sx(styles.cardTitle)}>Rate Plan &amp; Terms</h2>
          </div>
          <p {...sx(styles.cardDescription)}>
            Choose a per-{period} rate. The first invoice bills one {period} at the
            agreed rate.
          </p>
        </div>
        <div {...sx(styles.fieldGrid)}>
          <div {...sx(styles.fullField)}>
            <Selector
              label="Rate Plan"
              options={ratePlanOptions}
              htmlName="ratePlanId"
              value={selectedRatePlanId}
              onChange={handleRatePlanChange}
              isRequired
              placeholder="Select rate plan"
              isDisabled={!selectedRoomId}
            />
          </div>
          <NumberInput
            label={period === "day"
              ? "Agreed Daily Rent (₹)"
              : "Agreed Monthly Rent (₹)"}
            htmlName="agreedRentRupees"
            value={rentRupees}
            onChange={(value: number | null) => (rentRupees = value)}
            min={0}
            step={0.01}
            isRequired
          />
          <NumberInput
            label="Security Deposit (₹)"
            htmlName="agreedDepositRupees"
            value={depositRupees}
            onChange={(value: number | null) => (depositRupees = value)}
            min={0}
            step={0.01}
          />
          {#if period === "month"}<NumberInput
              label="Monthly Billing Day (1–28)"
              htmlName="billingDay"
              value={billingDay}
              onChange={(value: number | null) => (billingDay = value)}
              min={1}
              max={28}
              step={1}
              isRequired
              isIntegerOnly
            />{/if}
          <div>
            <label {...sx(styles.dateField)}>
              <span {...sx(styles.dateLabel)}
                >Check-In Date · Required (today or earlier)</span
              >
              <input
                type="date"
                name="checkInDate"
                max={todayInAppTimezone()}
                bind:value={checkInDate}
                required
                {...sx(styles.dateInput)}
              />
            </label>
          </div>
          {#if selectedPlan}
            <p {...sx(styles.cardDescription)}>
              Selected rate: {formatPaise(selectedPlan.rentPaise)} per {selectedPlan.billingPeriod ??
                "month"}.
            </p>
          {/if}
        </div>
      </Card>

      <Card xstyle={styles.card}>
        <div {...sx(styles.cardHeader)}>
          <div {...sx(styles.stepLine)}>
            <span {...sx(styles.step)}>04</span>
            <h2 {...sx(styles.cardTitle)}>Departure Plan</h2>
          </div>
          <p {...sx(styles.cardDescription)}>
            Leave the date blank if it’s unknown. A tentative date does not
            check the resident out.
          </p>
        </div>
        <div
          role="group"
          aria-label="Set a tentative duration"
          {...sx(stayStyles.actions)}
        >
          <Button
            label="3 days"
            variant="secondary"
            onclick={() => setDuration("days", 3)}
            xstyle={stayStyles.touch}
          />
          <Button
            label="2 months"
            variant="secondary"
            onclick={() => setDuration("months", 2)}
            xstyle={stayStyles.touch}
          />
          <Button
            label="3 months"
            variant="secondary"
            onclick={() => setDuration("months", 3)}
            xstyle={stayStyles.touch}
          />
          <Button
            label="Unknown"
            variant="secondary"
            onclick={() => setDuration("unknown")}
            xstyle={stayStyles.touch}
          />
        </div>
        <div {...sx(styles.fieldGrid)}>
          <label {...sx(styles.dateField)}>
            <span {...sx(styles.dateLabel)}>Tentative departure date</span>
            <input
              type="date"
              name="expectedEndDate"
              min={checkInDate || undefined}
              bind:value={expectedEndDate}
              {...sx(styles.dateInput)}
            />
          </label>
          <label {...sx(styles.dateField)}>
            <span {...sx(styles.dateLabel)}>Next follow-up date</span>
            <input
              type="date"
              name="followUpDate"
              bind:value={followUpDate}
              {...sx(styles.dateInput)}
            />
          </label>
        </div>
      </Card>

      <div {...sx(styles.actions)}>
        <Button
          label="Cancel"
          xstyle={stayStyles.touch}
          href={data.registeredResident
            ? `/residents/${encodeURIComponent(data.registeredResident.id)}`
            : "/dashboard"}
          variant="secondary"
        />
        <Button
          xstyle={stayStyles.touch}
          label={isSubmitting ? "Checking In…" : "Complete Check-In"}
          type="submit"
          variant="primary"
          isDisabled={isSubmitting ||
            !expectedHostelId ||
            !selectedRoomId ||
            !selectedBedId ||
            !selectedRatePlanId}
        >
          {#snippet icon()}<LogIn size={17} />{/snippet}
        </Button>
      </div>
    </form>
  {/if}
</div>
