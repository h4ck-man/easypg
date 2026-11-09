import { expect, test } from "@playwright/test";
import {
  assertNoPageOverflow,
  assertTouchTarget,
  fillRegistration,
  syntheticPng,
} from "../support/synthetic-resident";
import { createDemoFixtures } from "../../src/lib/api/fixtures";

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

test("mobile capture explains unreadable, oversized, and missing photos", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Demo Manager", exact: true }).tap();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page
    .getByRole("navigation", { name: "Mobile shortcuts" })
    .getByRole("link", { name: "Add resident" })
    .tap();

  await page.getByLabel(/Full name/i).fill("Synthetic Invalid Capture");
  await page.getByLabel(/Phone number/i).fill("0000000185");
  await page.getByRole("button", { name: "Save resident" }).tap();
  await expect(
    page.getByRole("alert").filter({ hasText: "Check the marked fields" }),
  ).toBeFocused();
  await expect(page).toHaveURL(/\/residents\/new$/);
  await expect(
    page.getByText("Take or choose a photo.", { exact: true }),
  ).toHaveCount(2);

  const portrait = page.getByLabel("Resident portrait", { exact: true });
  const preview = page.getByRole("img", { name: "Resident portrait preview" });
  await portrait.setInputFiles(
    await syntheticPng(page, "synthetic-portrait.png", "#195e90"),
  );
  await expect(preview).toBeVisible();
  await portrait.setInputFiles({
    name: "broken.png",
    mimeType: "image/png",
    buffer: Buffer.from("Not an image"),
  });
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "This image could not be opened" }),
  ).toBeVisible();
  await expect(portrait).toHaveAttribute("aria-invalid", "true");
  await expect(preview).toHaveCount(0);

  const identity = page.getByLabel("Identity document", { exact: true });
  await identity.setInputFiles({
    name: "oversized.png",
    mimeType: "image/png",
    buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
  });
  await expect(
    page.getByRole("alert").filter({ hasText: "Choose an image up to 10 MB." }),
  ).toBeVisible();
  await expect(identity).toHaveAttribute("aria-invalid", "true");
});

test("register a resident from mobile shortcuts and reopen the saved profile", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Demo Manager", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  const shortcuts = page.getByRole("navigation", { name: "Mobile shortcuts" });
  await expect(
    shortcuts.getByRole("link", { name: "Overview" }),
  ).toHaveAttribute("aria-current", "page");
  for (const link of await shortcuts.getByRole("link").all())
    await assertTouchTarget(link);
  await assertNoPageOverflow(page);
  await shortcuts.getByRole("link", { name: "Add resident" }).tap();

  await expect(
    page.getByRole("heading", { name: "Add resident", exact: true }),
  ).toBeVisible();
  await expect(shortcuts).not.toBeVisible();
  await assertNoPageOverflow(page);

  const name = "Synthetic Mobile Resident";
  await fillRegistration(page, name, "0000000184");
  const previewSources = await page
    .getByRole("img", { name: /preview$/ })
    .evaluateAll((images) => images.map((image) => image.getAttribute("src")));
  await assertTouchTarget(page.getByLabel(/Full name/i));
  await assertTouchTarget(page.getByLabel(/Phone number/i));
  const save = page.getByRole("button", { name: "Save resident" });
  await assertTouchTarget(save);
  await save.tap();

  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  const profileUrl = page.url();
  await expect(
    page.getByText("Registered", { exact: true }).first(),
  ).toBeVisible();
  const storedDemo = await page.evaluate(() =>
    Object.values(sessionStorage).join(" "),
  );
  expect(storedDemo).toContain(name);
  expect(storedDemo).not.toContain("data:image/");
  for (const image of previewSources) {
    expect(image).toMatch(/^data:image\/jpeg;base64,/);
    expect(storedDemo).not.toContain(image!.split(",")[1]);
  }
  await page.reload();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Resident portrait" }),
  ).toHaveCount(0);
  await assertNoPageOverflow(page);

  await page.getByRole("link", { name: "Assign bed", exact: true }).tap();
  await expect(page).toHaveURL(/\/check-ins\?residentId=/);
  expect(new URL(page.url()).searchParams.get("residentId")).toBe(
    new URL(profileUrl).pathname.split("/").pop(),
  );
  await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  await assertNoPageOverflow(page);
});

test("live registration preserves the request key after a dropped response and shows a conflict", async ({
  page,
}) => {
  const { app } = createDemoFixtures();
  const requests: { key: string; body: Record<string, string> }[] = [];
  await page.route("**/api/v1/session", (route) =>
    route.fulfill({ json: { data: { ...app, csrfToken: "test-csrf" } } }),
  );
  await page.route("**/api/v1/residents", async (route) => {
    const request = route.request();
    expect(request.method()).toBe("POST");
    expect(request.headers()["x-csrf-token"]).toBe("test-csrf");
    requests.push({
      key: request.headers()["idempotency-key"],
      body: request.postDataJSON(),
    });
    if (requests.length === 1) await route.abort("connectionreset");
    else
      await route.fulfill({
        status: 409,
        json: {
          error: {
            code: "CONFLICT",
            message: "This resident was already registered.",
          },
        },
      });
  });

  await page.goto("http://127.0.0.1:5191/residents/new");
  await expect(
    page.getByRole("heading", { name: "Add resident", exact: true }),
  ).toBeVisible();
  await fillRegistration(page, "Synthetic Retry Resident", "0000000186");
  const save = page.getByRole("button", { name: "Save resident" });
  const feedback = page
    .getByRole("form", { name: "Add resident" })
    .getByRole("alert");
  await save.tap();
  await expect(
    feedback.filter({ hasText: "The configured API could not be reached" }),
  ).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(requests[0].key).toBeTruthy();
  expect(Object.keys(requests[0].body).sort()).toEqual([
    "expectedHostelId",
    "fullName",
    "identityImage",
    "phone",
    "portraitImage",
  ]);
  expect(requests[0].body.expectedHostelId).toBe(app.scope?.activeHostelId);
  expect(requests[0].body.fullName).toBe("Synthetic Retry Resident");
  expect(requests[0].body.phone).toBe("0000000186");
  expect(requests[0].body.portraitImage).toMatch(/^data:image\/jpeg;base64,/);
  expect(requests[0].body.identityImage).toMatch(/^data:image\/jpeg;base64,/);
  expect(requests[0].body.portraitImage).not.toBe(
    requests[0].body.identityImage,
  );

  await save.tap();
  await expect(
    feedback.filter({ hasText: "This resident was already registered." }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/residents\/new$/);
  await expect(page.getByLabel(/Full name/i)).toHaveValue(
    "Synthetic Retry Resident",
  );
  await expect(page.getByRole("img", { name: /preview$/ })).toHaveCount(2);
  expect(requests).toHaveLength(2);
  expect(requests[1]).toEqual(requests[0]);
});

test("a rejected property switch keeps the registration scope visible", async ({
  page,
}) => {
  const { app } = createDemoFixtures("organization_admin");
  const secondProperty = {
    id: "demo-hostel-b",
    name: "Synthetic Second Property",
    code: "SSP",
  };
  await page.route("**/api/v1/session", (route) =>
    route.fulfill({
      json: {
        data: {
          ...app,
          hostels: [...app.hostels, secondProperty],
          scope: {
            ...app.scope,
            allowedHostelIds: [app.hostels[0].id, secondProperty.id],
          },
          csrfToken: "test-csrf",
        },
      },
    }),
  );
  await page.route("**/api/v1/session/active-hostel", (route) =>
    route.fulfill({
      status: 409,
      json: {
        error: {
          code: "CONFLICT",
          message: "The selected property is no longer available.",
        },
      },
    }),
  );
  await page.goto("http://127.0.0.1:5191/residents/new");
  const selector = page.getByRole("combobox", { name: "Switch property" });
  await expect(selector).toContainText(app.hostels[0].name);
  await selector.tap();
  await page.getByRole("option", { name: /Synthetic Second Property/ }).tap();
  await expect(
    page
      .getByText("The selected property is no longer available.", {
        exact: true,
      })
      .first(),
  ).toBeVisible();
  await expect(selector).toBeEnabled();
  await expect(selector).toContainText(app.hostels[0].name);
});
