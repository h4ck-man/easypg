import { randomInt } from "node:crypto";
import { expect, test } from "@playwright/test";
import {
  assertNoPageOverflow,
  assertTouchTarget,
  fillRegistration,
} from "../support/synthetic-resident";

test("local PostgreSQL: register with photos, assign a bed, record payment, and check out", async ({
  page,
  request,
}, testInfo) => {
  const password = process.env.EASYPG_LOCAL_TEST_PASSWORD;
  if (!password)
    throw new Error(
      "Set EASYPG_LOCAL_TEST_PASSWORD to the local synthetic manager password.",
    );

  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Demo Manager" })).toHaveCount(
    0,
  );
  await page
    .locator('[name="email"]')
    .fill(process.env.EASYPG_LOCAL_TEST_EMAIL || "manager@easypg.local");
  await page.locator('[name="password"]').fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).tap();
  await expect(page).toHaveURL(/\/supervisor$/);
  await assertNoPageOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("dashboard-mobile.png") });

  const add = page
    .getByRole("navigation", { name: "Mobile shortcuts" })
    .getByRole("link", { name: "Add resident" });
  await assertTouchTarget(add);
  await add.tap();
  await expect(
    page.getByRole("heading", { name: "Add resident", exact: true }),
  ).toBeVisible();
  await assertNoPageOverflow(page);
  await page.screenshot({
    path: testInfo.outputPath("registration-mobile.png"),
  });

  const name = `Synthetic Local Resident ${Date.now()}`;
  const phone = `000${randomInt(1_000_000, 10_000_000)}`;
  await fillRegistration(page, name, phone);
  const save = page.getByRole("button", { name: "Save resident" });
  await assertTouchTarget(save);
  await save.tap();

  const profileHeading = page.getByRole("heading", { name, exact: true });
  await expect(profileHeading).toBeVisible();
  const profileUrl = page.url();
  await page.reload();
  await expect(profileHeading).toBeVisible();
  await expect(
    page.getByText("Registered", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText(phone, { exact: true }).first()).toBeVisible();
  await assertNoPageOverflow(page);
  const portrait = page.getByRole("img", { name: "Resident portrait" });
  await expect(portrait).toBeVisible();
  await expect
    .poll(() =>
      portrait.evaluate((image: HTMLImageElement) => image.naturalWidth),
    )
    .toBe(32);
  await page.screenshot({
    path: testInfo.outputPath("registered-profile-mobile.png"),
  });
  const portraitUrl = new URL(
    (await portrait.getAttribute("src"))!,
    page.url(),
  );
  const identityLink = page.getByRole("link", {
    name: "View identity document",
  });
  const identityUrl = new URL(
    (await identityLink.getAttribute("href"))!,
    page.url(),
  );
  const savedPhotos: Buffer[] = [];
  for (const url of [portraitUrl, identityUrl]) {
    const response = await page.request.get(url.href);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()["content-type"]).toContain("image/jpeg");
    const bytes = await response.body();
    expect([...bytes.subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
    savedPhotos.push(bytes);
  }
  expect(savedPhotos[0]).not.toEqual(savedPhotos[1]);
  expect((await request.get(identityUrl.href)).status()).toBe(401);

  await page.getByRole("link", { name: "Assign bed", exact: true }).tap();
  await expect(page).toHaveURL(/\/check-ins\?residentId=/);
  await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  await assertNoPageOverflow(page);

  const chooseFirst = async (label: RegExp) => {
    await page.getByRole("combobox", { name: label }).tap();
    await page.getByRole("listbox").getByRole("option").first().tap();
  };
  await page.getByRole("combobox", { name: /^Room/i }).tap();
  await page.getByRole("option", { name: /^Room 103\b/ }).tap();
  await chooseFirst(/^Bed/i);
  await chooseFirst(/^Rate Plan/i);
  const checkInDate = await page
    .locator('input[name="checkInDate"]')
    .inputValue();
  await page.getByRole("button", { name: "Complete Check-In" }).tap();
  await expect(page).toHaveURL(profileUrl);
  await expect(
    page.getByText("Active tenancy", { exact: true }).first(),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Record payment", exact: true })
    .first()
    .tap();
  const dialog = page.getByRole("dialog");
  await dialog.locator('[name="amountRupees"]').fill("1");
  await dialog
    .getByRole("button", { name: "Confirm payment", exact: true })
    .tap();
  await expect(dialog).not.toBeVisible();

  await page.getByRole("button", { name: "Check out", exact: true }).tap();
  await dialog.locator('input[name="checkOutDate"]').fill(checkInDate);
  await dialog
    .getByRole("button", { name: "Confirm check-out", exact: true })
    .tap();
  await expect(dialog).not.toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Checked out", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Payments (1)", exact: true }).tap();
  await expect(
    page.getByRole("tabpanel").getByText("₹1.00", { exact: true }),
  ).toBeVisible();

  await page.goto("/residents/new");
  await fillRegistration(page, "Synthetic Duplicate Phone", phone);
  await page.getByRole("button", { name: "Save resident" }).tap();
  await expect(
    page.getByRole("form", { name: "Add resident" }).getByRole("alert").filter({
      hasText:
        "A person with this phone number is already registered at this property.",
    }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/residents\/new$/);
});
