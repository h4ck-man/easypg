<script lang="ts">
  import { Button, Card, Heading, Text } from "@astryx-svelte/core";
  import { config } from "$lib/api/config";
  import { enhance, feedback } from "$lib/api/forms";
  import { sx } from "$lib/design/attrs";
  import Camera from "@lucide/svelte/icons/camera";
  import { onMount, tick } from "svelte";
  import type { HostelOption } from "$lib/api/contracts";
  import { preparePhoto } from "./images";
  import { styles } from "./page.stylex";

  let { hostel }: { hostel: HostelOption | undefined } = $props();
  const imageFields = [
    {
      name: "portraitImage",
      title: "Resident portrait",
      hint: "Frame the face in good light.",
      camera: "user",
    },
    {
      name: "identityImage",
      title: "Identity document",
      hint: "Keep all edges and text in view.",
      camera: "environment",
    },
  ] as const;
  type PhotoName = (typeof imageFields)[number]["name"];
  interface Photo {
    value: string;
    busy: boolean;
    error: string;
    version: number;
  }
  let photos = $state<Record<PhotoName, Photo>>({
    portraitImage: { value: "", busy: false, error: "", version: 0 },
    identityImage: { value: "", busy: false, error: "", version: 0 },
  });
  let submitting = $state(false);
  let localErrors = $state<Record<string, string>>({});
  let errorSummary = $state<HTMLDivElement>();
  let form = $derived($feedback);
  let busy = $derived(imageFields.some(({ name }) => photos[name].busy));
  onMount(() => {
    feedback.set(null);
    return () => {
      feedback.set(null);
    };
  });

  function errorFor(name: string) {
    return localErrors[name] ?? form?.fieldErrors?.[name];
  }

  async function selectPhoto(name: PhotoName, input: HTMLInputElement) {
    const file = input.files?.[0];
    if (!file) return;
    input.value = "";
    localErrors = { ...localErrors, [name]: "" };
    const version = ++photos[name].version;
    photos[name].busy = true;
    photos[name].value = "";
    photos[name].error = "";
    try {
      const result = await preparePhoto(file);
      if (photos[name].version === version) photos[name].value = result;
    } catch (error) {
      if (photos[name].version === version)
        photos[name].error =
          error instanceof Error
            ? error.message
            : "The photo could not be prepared.";
    } finally {
      if (photos[name].version === version) photos[name].busy = false;
    }
  }

  async function focusSummary() {
    await tick();
    errorSummary?.focus();
  }
</script>

<svelte:head><title>Add resident — EasyPG</title></svelte:head>

<div {...sx(styles.page)}>
  <a href="/residents" {...sx(styles.back)}>← Residents</a>
  <header {...sx(styles.header)}>
    <Heading level={1}>Add resident</Heading>
    <Text as="p" type="supporting">
      Save their contact details and photos. Assign a bed when they’re ready to
      check in.
    </Text>
    {#if hostel}<Text as="p" type="supporting">{hostel.name}</Text>{/if}
  </header>

  {#if config.mode === "demo"}
    <div {...sx(styles.notice)}>
      Demo mode: use synthetic details and images. Demo photos are not saved.
    </div>
  {/if}

  {#if !hostel}
    <Card padding={4}>
      <Heading level={2}>Choose a hostel first</Heading>
      <Text as="p" type="supporting"
        >A resident record belongs to the selected hostel.</Text
      >
      <Button label="View hostels" href="/hostels" variant="secondary" />
    </Card>
  {:else}
    <form
      aria-label="Add resident"
      method="POST"
      data-operation="registerResident"
      {...sx(styles.form)}
      use:enhance={async ({ formData, cancel }) => {
        localErrors = {};
        const fullName = String(formData.get("fullName") ?? "").trim();
        const phone = String(formData.get("phone") ?? "").trim();
        if (fullName.length < 2)
          localErrors.fullName = "Enter the resident’s full name.";
        if (!/^\+?[0-9]{10,15}$/.test(phone.replace(/[ ()-]/g, "")))
          localErrors.phone = "Enter a phone number with 10–15 digits.";
        for (const field of imageFields) {
          const photo = photos[field.name];
          if (!photo.value) localErrors[field.name] = "Take or choose a photo.";
          else formData.set(field.name, photo.value);
        }
        if (Object.keys(localErrors).length) {
          cancel();
          await focusSummary();
          return;
        }
        submitting = true;
        formData.set("fullName", fullName);
        formData.set("phone", phone);
        return async ({ result, update }) => {
          submitting = false;
          if (result.type === "failure") await focusSummary();
          else await update();
        };
      }}
    >
      <input type="hidden" name="expectedHostelId" value={hostel.id} />
      {#if form?.error || Object.values(localErrors).some(Boolean)}
        <div
          bind:this={errorSummary}
          tabindex="-1"
          role="alert"
          {...sx(styles.error)}
        >
          {form?.error ?? "Check the marked fields and try again."}
        </div>
      {/if}

      <Card padding={4} xstyle={styles.card}>
        <div {...sx(styles.contact)}>
          <div {...sx(styles.field)}>
            <label for="registration-name">Full name</label>
            <input
              id="registration-name"
              name="fullName"
              autocomplete="name"
              required
              maxlength="120"
              aria-invalid={!!errorFor("fullName")}
              aria-describedby={errorFor("fullName")
                ? "registration-name-error"
                : undefined}
              disabled={submitting}
              {...sx(styles.textInput)}
            />
            {#if errorFor("fullName")}<span
                id="registration-name-error"
                {...sx(styles.fieldError)}>{errorFor("fullName")}</span
              >{/if}
          </div>
          <div {...sx(styles.field)}>
            <label for="registration-phone">Phone number</label>
            <input
              id="registration-phone"
              name="phone"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              required
              maxlength="25"
              aria-invalid={!!errorFor("phone")}
              aria-describedby={errorFor("phone")
                ? "registration-phone-error"
                : undefined}
              disabled={submitting}
              {...sx(styles.textInput)}
            />
            {#if errorFor("phone")}<span
                id="registration-phone-error"
                {...sx(styles.fieldError)}>{errorFor("phone")}</span
              >{/if}
          </div>
        </div>

        <div {...sx(styles.photos)}>
          {#each imageFields as field (field.name)}
            {@const photo = photos[field.name]}
            {@const photoError = photo.error || errorFor(field.name)}
            <div {...sx(styles.photo)}>
              {#if photo.value}
                <img
                  src={photo.value}
                  alt={`${field.title} preview`}
                  {...sx(styles.preview)}
                />
              {/if}
              <div {...sx(styles.photoText)}>
                <label for={field.name} {...sx(styles.photoTitle)}
                  >{field.title}</label
                >
                <span id={`${field.name}-hint`} {...sx(styles.hint)}
                  >{field.hint}</span
                >
                {#if photoError}<span
                    role="alert"
                    id={`${field.name}-error`}
                    {...sx(styles.fieldError)}>{photoError}</span
                  >{/if}
              </div>
              <div {...sx(styles.capture)}>
                <Camera size={18} aria-hidden="true" />
                <span aria-hidden="true"
                  >{photo.busy
                    ? "Preparing…"
                    : photo.value
                      ? "Replace photo"
                      : "Take or choose photo"}</span
                >
                <input
                  id={field.name}
                  type="file"
                  accept="image/*"
                  capture={field.camera}
                  aria-required="true"
                  aria-invalid={!!photoError}
                  aria-describedby={`${field.name}-hint${photoError ? ` ${field.name}-error` : ""}`}
                  disabled={submitting}
                  onchange={(event) =>
                    selectPhoto(field.name, event.currentTarget)}
                  {...sx(styles.captureInput)}
                />
              </div>
              <span role="status" {...sx(styles.visuallyHidden)}>
                {photo.busy
                  ? "Preparing photo"
                  : photo.value
                    ? "Photo selected. Choose again to replace."
                    : ""}
              </span>
            </div>
          {/each}
        </div>
      </Card>

      <div {...sx(styles.actions)}>
        <Button
          label="Cancel"
          href="/residents"
          variant="secondary"
          xstyle={styles.button}
        />
        <Button
          label={submitting ? "Saving resident…" : "Save resident"}
          type="submit"
          variant="primary"
          xstyle={styles.button}
          isDisabled={submitting || busy}
        />
      </div>
    </form>
  {/if}
</div>
