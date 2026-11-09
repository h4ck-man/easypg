import { randomInt, randomUUID } from "node:crypto";
import { expect, test, type Locator, type Page } from "@playwright/test";
import type { LeavingSoonPage, PageDataMap } from "../../src/lib/api/contracts";
import {
  assertNoPageOverflow,
  assertTouchTarget,
} from "../support/synthetic-resident";

async function signIn(page: Page) {
  const password = process.env.EASYPG_LOCAL_TEST_PASSWORD;
  if (!password)
    throw new Error(
      "Set EASYPG_LOCAL_TEST_PASSWORD to the local synthetic supervisor password.",
    );
  await page.goto("/login?portal=supervisor");
  await page.locator('[name="email"]').fill("supervisor2@easypg.local");
  await page.locator('[name="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).tap();
  await expect(page).toHaveURL(/\/supervisor$/);
}

async function read<T>(page: Page, path: string): Promise<T> {
  const response = await page.request.get(
    new URL(`/api/v1${path}`, page.url()).href,
  );
  expect(response.status(), path).toBe(200);
  return (await response.json()).data as T;
}

async function assertSelectorFitsCard(trigger: Locator, label: string) {
  await expect(trigger).toBeVisible();
  const layout = await trigger.evaluate((button) => {
    const card = button.closest(".astryx-card");
    const control = button.parentElement;
    const chevron = control?.querySelector(".astryx-selector-indicator-icon");
    if (!card || !control || !chevron)
      throw new Error("Expected a selector with a chevron inside a card");
    const cardBounds = card.getBoundingClientRect();
    const controlBounds = control.getBoundingClientRect();
    const chevronBounds = chevron.getBoundingClientRect();
    return {
      cardLeft: cardBounds.left,
      cardRight: cardBounds.right,
      controlLeft: controlBounds.left,
      controlRight: controlBounds.right,
      chevronLeft: chevronBounds.left,
      chevronRight: chevronBounds.right,
      chevronWidth: chevronBounds.width,
    };
  });
  // A clipping card can mask an oversized selector without causing page overflow.
  expect(layout.controlLeft, `${label} control left edge`).toBeGreaterThanOrEqual(
    layout.cardLeft,
  );
  expect(layout.controlRight, `${label} control right edge`).toBeLessThanOrEqual(
    layout.cardRight,
  );
  expect(layout.chevronWidth, `${label} chevron width`).toBeGreaterThan(0);
  expect(layout.chevronLeft, `${label} chevron left edge`).toBeGreaterThanOrEqual(
    layout.controlLeft,
  );
  expect(layout.chevronRight, `${label} chevron right edge`).toBeLessThanOrEqual(
    layout.controlRight,
  );
}

test("supervisor records phone and walk-in enquiries without reserving inventory", async ({
  page,
}) => {
  await signIn(page);
  await page.goto("/inquiries");
  await expect(
    page.getByRole("heading", { name: "Enquiries", exact: true }),
  ).toBeVisible();
  const before = await read<PageDataMap["/rooms"]>(page, "/views/rooms");

  for (const source of ["phone", "walk_in"] as const) {
    const name = `Synthetic ${source} enquiry ${randomUUID().slice(0, 8)}`;
    const add = page.getByRole("button", { name: "New enquiry" });
    await assertTouchTarget(add);
    await add.tap();
    const form = page.getByRole("form", { name: "New enquiry" });
    await form.getByLabel(/Contact name/i).fill(name);
    await form.getByLabel("Enquiry source").selectOption(source);
    if (source === "phone")
      await form.getByLabel(/Phone number/i).fill("9000000080");
    await form.getByLabel("Party size").fill("2");
    await form.getByLabel("Stay type").selectOption("short");
    await form.getByLabel("AC preference").selectOption("ac");
    await form.getByLabel("Sharing preference").selectOption("2");
    await assertNoPageOverflow(page);
    const save = form.getByRole("button", { name: "Record enquiry" });
    await assertTouchTarget(save);
    await save.tap();
    const card = page.getByRole("article", { name, exact: true });
    await expect(
      card.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
    await expect(
      card.getByText(source === "phone" ? /Phone call/ : /Walk-in/),
    ).toBeVisible();
    if (source === "phone")
      await expect(
        card.getByRole("link", { name: /Call 9000000080/ }),
      ).toHaveAttribute("href", "tel:9000000080");
    for (const status of ["contacted", "closed"] as const) {
      await card.getByRole("button", { name: "Update enquiry" }).tap();
      await card.getByLabel("Enquiry status").selectOption(status);
      await card.getByRole("button", { name: "Save enquiry status" }).tap();
      await expect(
        card.getByText(status === "contacted" ? "Contacted" : "Closed", {
          exact: true,
        }),
      ).toBeVisible();
    }
  }
  const after = await read<PageDataMap["/rooms"]>(page, "/views/rooms");
  expect(after.stats).toEqual(before.stats);
  await assertNoPageOverflow(page);
});

test("daily admission and a stale departure draft preserve the occupied bed", async ({
  page,
}) => {
  await signIn(page);
  await page.goto("/check-ins");
  const form = page.getByRole("form", { name: "Check-in form" });
  const name = `Synthetic Daily Resident ${randomUUID().slice(0, 8)}`;
  const phone = `000${randomInt(1_000_000, 10_000_000)}`;
  await form.locator('[name="fullName"]').fill(name);
  await form.locator('[name="phone"]').fill(phone);
  await form.getByRole("combobox", { name: /^Gender/ }).tap();
  await page.getByRole("option", { name: "Female", exact: true }).tap();
  await form.getByLabel("Stay type").selectOption("short");
  await form.getByLabel("AC filter").selectOption("ac");
  await form.getByLabel("Sharing filter").selectOption("2");
  const room = form.getByRole("combobox", { name: /^Room/ });
  await room.tap();
  await page.getByRole("option", { name: /^Room 107\b/ }).tap();
  await form.getByRole("combobox", { name: /^Bed/ }).tap();
  await page.getByRole("option", { name: "A", exact: true }).tap();
  const ratePlan = form.getByRole("combobox", { name: /^Rate Plan/ });
  await ratePlan.tap();
  const dailyRate = page.getByRole("option", {
    name: /Shared daily.*₹1,000\.00\/day/,
  });
  await expect(
    page.getByRole("option", { name: /Shared monthly/ }),
  ).toHaveCount(0);
  await dailyRate.tap();
  await expect(room).toContainText("Room 107");
  await expect(ratePlan).toContainText("Shared daily");
  await assertSelectorFitsCard(room, "Room");
  await assertSelectorFitsCard(ratePlan, "Rate plan");
  const arrived = await form.locator('[name="checkInDate"]').inputValue();
  const dateAfter = (days: number) => {
    const value = new Date(`${arrived}T00:00:00Z`);
    value.setUTCDate(value.getUTCDate() + days);
    return value.toISOString().slice(0, 10);
  };
  await form.getByRole("button", { name: "3 days", exact: true }).tap();
  await expect(form.getByLabel("Tentative departure date")).toHaveValue(
    dateAfter(3),
  );
  const submit = form.getByRole("button", { name: "Complete Check-In" });
  await assertTouchTarget(submit);
  await assertNoPageOverflow(page);
  await submit.tap();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  const profileUrl = page.url();
  await expect(
    page.getByText("Agreed daily rent", { exact: true }),
  ).toBeVisible();
  const profilePath = new URL(profileUrl).pathname;
  const profile = await read<PageDataMap["/residents/:id"]>(
    page,
    `/views${profilePath}`,
  );
  expect(profile.invoices).toHaveLength(1);
  expect(profile.invoices[0]).toMatchObject({
    totalPaise: "100000",
    periodStart: arrived,
    periodEnd: arrived,
  });

  await page.goto("/leaving-soon");
  await expect(
    page.getByRole("heading", { name: "Leaving soon", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next 7 days", exact: true }).tap();
  const card = page.getByRole("article", { name, exact: true });
  const edit = card.getByRole("button", { name: "Edit departure plan" });
  await assertTouchTarget(edit);
  await edit.tap();
  const plan = card.getByRole("form", { name: "Departure plan" });
  await expect(plan.getByLabel("Planned departure date")).toHaveValue(
    dateAfter(3),
  );

  const view = await read<LeavingSoonPage>(page, "/views/leaving-soon");
  const item = view.items.find((row) => row.name === name)!;
  expect(item).toBeTruthy();
  const session = await read<{ csrfToken: string }>(page, "/session");
  const concurrent = await page.request.post(
    new URL("/api/v1/stays/departure-plan", page.url()).href,
    {
      headers: {
        Origin: new URL(page.url()).origin,
        "X-CSRF-Token": session.csrfToken,
        "Idempotency-Key": randomUUID(),
      },
      data: {
        residentId: item.residentId,
        agreementId: item.agreementId,
        expectedVersion: String(item.version),
        expectedHostelId: item.hostelId,
        departureIntent: "tentative",
        expectedEndDate: dateAfter(4),
        notes: "Another supervisor adjusted the plan.",
      },
    },
  );
  expect(concurrent.status()).toBe(200);
  await plan.getByLabel("Planned departure date").fill(dateAfter(5));
  await plan.getByRole("button", { name: "Save departure plan" }).tap();
  await expect(card.getByRole("alert")).toContainText(/changed/i);
  await plan.getByRole("button", { name: "Load latest plan" }).tap();
  await expect(plan.getByLabel("Planned departure date")).toHaveValue(
    dateAfter(4),
  );
  await plan.getByLabel("Departure intent").selectOption("confirmed");
  await plan.getByLabel("Mark contacted now").check();
  await plan.getByLabel("Next follow-up date").fill(dateAfter(1));
  await plan.getByRole("button", { name: "Save departure plan" }).tap();
  await expect(card.getByText("Confirmed", { exact: true })).toBeVisible();
  await expect(card.getByText("₹1,000.00", { exact: true })).toBeVisible();
  await assertNoPageOverflow(page);
  const saved = await read<PageDataMap["/residents/:id"]>(
    page,
    `/views${profilePath}`,
  );
  expect(saved.resident.status).toBe("active");
  expect(saved.resident.bed).toEqual(profile.resident.bed);
  expect(saved.resident.activeAgreement).toMatchObject({
    expectedEndDate: dateAfter(4),
    departureIntent: "confirmed",
    followUpDate: dateAfter(1),
  });
  expect(saved.resident.activeAgreement?.lastContactedAt).toBeTruthy();
  expect(saved.invoices).toEqual(profile.invoices);

  await page.goto(profileUrl);
  await expect(
    page.getByRole("button", { name: "Edit departure plan" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Check out", exact: true }).tap();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm check-out", exact: true })
    .tap();
  await expect(
    page.getByText("Checked out", { exact: true }).first(),
  ).toBeVisible();
});
