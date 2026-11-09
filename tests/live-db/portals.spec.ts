import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { assertNoPageOverflow, assertTouchTarget } from "../support/synthetic-resident";

const workspaces = [
  { account: "manager", portal: "supervisor", label: "Supervisor" },
  { account: "hostelowner", portal: "owner", label: "Owner" },
  { account: "owner", portal: "portfolio", label: "Super owner" },
  { account: "admin", portal: "admin", label: "EasyPG administrator" },
] as const;

function password() {
  const value = process.env.EASYPG_LOCAL_TEST_PASSWORD;
  if (!value) throw new Error("Set EASYPG_LOCAL_TEST_PASSWORD for the synthetic test accounts.");
  return value;
}

async function signIn(page: Page, email: string, secret: string, portal: string, label: string) {
  await page.goto("/login");
  const entry = page.getByRole("navigation", { name: "Choose your workspace" }).getByRole("link", { name: label, exact: true });
  await assertTouchTarget(entry);
  await entry.tap();
  await expect(page).toHaveURL(new RegExp(`/login\\?portal=${portal}$`));
  await expect(page.getByRole("button", { name: /Demo Manager/ })).toHaveCount(0);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel(/^Password/).fill(secret);
  await page.getByRole("button", { name: "Sign in", exact: true }).tap();
  await expect(page).toHaveURL(new RegExp(`/${portal}$`));
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await assertNoPageOverflow(page);
}

for (const { account, portal, label } of workspaces) {
  test(`${label} opens its own portal and receives 403 from a different portal`, async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
    await signIn(page, `${account}@easypg.local`, password(), portal, label);
    await page.goto("/");
    await expect(page).toHaveURL(new RegExp(`/${portal}$`));
    const overview = page.getByRole("navigation", { name: "Mobile shortcuts" }).getByRole("link", { name: "Overview" });
    await expect(overview).toHaveAttribute("aria-current", "page");
    for (const link of await page.getByRole("navigation", { name: "Mobile shortcuts" }).getByRole("link").all()) {
      await assertTouchTarget(link);
    }

    if (portal === "owner") {
      const hostels = page.getByRole("region", { name: "Hostels", exact: true });
      const roomLink = hostels.getByRole("link", { name: "View rooms", exact: true }).first();
      if (await roomLink.count()) await roomLink.tap();
      else await hostels.getByRole("button", { name: "View rooms", exact: true }).first().tap();
      await expect(page.getByRole("heading", { name: "Rooms & Beds", exact: true })).toBeVisible();
      await page.goto("/residents");
      await expect(page.getByRole("heading", { name: "Residents", exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: /Add resident|Check in resident/ })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Check out", exact: true })).toHaveCount(0);
      await assertNoPageOverflow(page);
    }

    const denied = portal === "admin" ? "supervisor" : "admin";
    const response = page.waitForResponse(result => new URL(result.url()).pathname === `/api/v1/views/${denied}`);
    await page.goto('/' + denied);
    expect((await response).status()).toBe(403);
    await expect(page.getByText("This page could not be loaded", { exact: true })).toBeVisible();
  });
}

for (const { account, portal, label } of workspaces) {
  test(`${label} loopback hostname selects its workspace`, async ({ page, baseURL }, testInfo) => {
    const url = new URL(baseURL ?? "http://127.0.0.1:5180");
    url.hostname = `${portal}.easypg.localhost`;
    await page.goto(url.href);
    await expect(page).toHaveURL(new RegExp(`/login\\?.*portal=${portal}`));
    await expect(page.getByRole("link", { name: label, exact: true })).toHaveAttribute("aria-current", "page");
    await page.screenshot({ path: testInfo.outputPath("portal-entry-mobile.png") });
    await page.getByLabel("Email address").fill(`${account}@easypg.local`);
    await page.getByLabel(/^Password/).fill(password());
    await page.getByRole("button", { name: "Sign in", exact: true }).tap();
    url.pathname = '/' + portal;
    await expect(page).toHaveURL(url.href);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
}

test("choosing a portal clears the old destination and cannot grant a supervisor admin access", async ({ page }) => {
  await page.goto("/login?redirectTo=%2Fsetup");
  await page.getByRole("navigation", { name: "Choose your workspace" })
    .getByRole("link", { name: "EasyPG administrator", exact: true }).tap();
  await expect(page).toHaveURL(/\/login\?portal=admin$/);
  await page.getByLabel("Email address").fill("manager@easypg.local");
  await page.getByLabel(/^Password/).fill(password());
  const rejected = page.waitForResponse(response => new URL(response.url()).pathname === "/api/v1/session" && response.request().method() === "POST");
  await page.getByRole("button", { name: "Sign in", exact: true }).tap();
  expect((await rejected).status()).toBe(403);
  await expect(page.getByText("Sign in failed", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/login\?portal=admin$/);
});

test("administrator creates hostels and rooms, then grants scoped staff access", async ({ page, browser }, testInfo) => {
  const suffix = randomUUID().slice(0, 8);
  const organizationName = `Synthetic Portal Org ${suffix}`;
  const hostelName = `Synthetic Portal Hostel ${suffix}`;
  const secondHostelName = `Synthetic Annex ${suffix}`;
  const staffName = `Synthetic Supervisor ${suffix}`;
  const email = `supervisor-${suffix}@example.invalid`;
  const initialPassword = `Synthetic-${randomUUID()}`;

  await signIn(page, "admin@easypg.local", password(), "admin", "EasyPG administrator");
  await page.getByRole("link", { name: "Open setup" }).tap();
  await expect(page.getByRole("heading", { name: "Setup", exact: true })).toBeVisible();
  await assertNoPageOverflow(page);
  await page.screenshot({ path: testInfo.outputPath("setup-mobile.png") });

  const org = page.getByRole("region", { name: "Create organization" });
  await org.getByLabel("Organization name").fill(organizationName);
  await org.getByLabel("Organization code").fill(`synthetic-portal-${suffix}`);
  await org.getByRole("button", { name: "Create organization", exact: true }).tap();
  await expect(org.getByText("Saved", { exact: true })).toBeVisible();

  const hostel = page.getByRole("region", { name: "Create hostel" });
  for (const [name, code, gender] of [[hostelName, "PT", "female"], [secondHostelName, "PA", "male"]]) {
    await hostel.getByLabel("Organization", { exact: true }).selectOption({ label: organizationName });
    await hostel.getByLabel("Hostel name").fill(name);
    await hostel.getByLabel("Hostel code").fill(`${code}-${suffix}`);
    await hostel.getByLabel("City", { exact: true }).fill("Hyderabad");
    await hostel.getByLabel("Street address").fill("Synthetic Test Lane");
    await hostel.getByLabel("Hostel gender policy").selectOption(gender);
    await hostel.getByLabel("Departure reminder").selectOption("4");
    await hostel.getByRole("button", { name: "Create hostel", exact: true }).tap();
    await expect(hostel.getByText("Saved", { exact: true })).toBeVisible();
  }

  const rooms = page.getByRole("region", { name: "Add room batch" });
  await rooms.getByLabel("Hostel", { exact: true }).selectOption({ label: hostelName });
  await rooms.getByLabel("Building", { exact: true }).fill("Main");
  await rooms.getByLabel("Floor", { exact: true }).fill("Ground");
  await rooms.getByLabel("First room number").fill("601");
  await rooms.getByLabel("Number of rooms").fill("2");
  await rooms.getByLabel("Beds per room").selectOption("3");
  await rooms.getByLabel("Cooling").selectOption("ac");
  await rooms.getByLabel("Monthly rent (₹)").fill("8100.50");
  await rooms.getByLabel("Daily rate (₹)").fill("600.25");
  await rooms.getByLabel("Deposit (₹)").fill("1000");
  await rooms.getByRole("button", { name: "Create room batch" }).tap();
  await expect(rooms.getByText("Saved", { exact: true })).toBeVisible();

  const staff = page.getByRole("region", { name: "Add staff access" });
  await staff.getByLabel("Full name").fill(staffName);
  await staff.getByLabel("Email address").fill(email);
  await staff.getByLabel("Role", { exact: true }).selectOption("manager");
  await staff.getByLabel("Organization", { exact: true }).selectOption({ label: organizationName });
  await staff.getByRole("checkbox", { name: hostelName, exact: true }).check();
  await staff.getByLabel("Initial password").fill(initialPassword);
  await staff.getByRole("button", { name: "Add staff access", exact: true }).tap();
  await expect(staff.getByText("Saved", { exact: true })).toBeVisible();

  const assignment = page.getByRole("region", { name: "Edit staff assignments" })
    .getByRole("button", { name: `Save assignments for ${staffName}`, exact: true });
  const assignmentForm = assignment.locator("xpath=ancestor::form");
  await expect(assignmentForm.getByRole("checkbox", { name: hostelName, exact: true })).toBeChecked();
  await assignmentForm.getByRole("checkbox", { name: secondHostelName, exact: true }).check();
  await assignment.tap();
  await expect(assignmentForm.getByText("Saved", { exact: true })).toBeVisible();

  // Add a second membership for the same account without resetting its password.
  await staff.getByLabel("Account type").selectOption("existing");
  await staff.getByLabel("Existing account", { exact: true }).selectOption({ label: `${staffName} · ${email} — ${organizationName}: Supervisor` });
  await expect(staff.getByLabel("Initial password")).toHaveCount(0);
  await staff.getByLabel("Role", { exact: true }).selectOption("property_owner");
  await staff.getByLabel("Organization", { exact: true }).selectOption({ label: organizationName });
  await staff.getByRole("checkbox", { name: hostelName, exact: true }).check();
  await staff.getByRole("button", { name: "Add staff access", exact: true }).tap();
  await expect(staff.getByText("Saved", { exact: true })).toBeVisible();

  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const supervisor = await context.newPage();
    await signIn(supervisor, email, initialPassword, "supervisor", "Supervisor");
    const assigned = supervisor.getByRole("region", { name: "Hostels", exact: true });
    await expect(assigned.getByRole("heading", { name: hostelName, exact: true })).toBeVisible();
    await expect(assigned.getByRole("heading", { name: secondHostelName, exact: true })).toBeVisible();
    await expect(assigned.getByText("0 residents · 6 available beds", { exact: true })).toBeVisible();
    await supervisor.getByRole("searchbox", { name: "Search hostels" }).fill(hostelName);
    await supervisor.getByRole("button", { name: "Search", exact: true }).tap();
    await expect(assigned.getByRole("heading", { name: secondHostelName, exact: true })).toHaveCount(0);
    const roomsLink = assigned.getByRole("link", { name: "View rooms", exact: true });
    if (await roomsLink.count()) await roomsLink.tap();
    else await assigned.getByRole("button", { name: "View rooms", exact: true }).tap();
    await expect(supervisor.getByRole("heading", { name: "Rooms & Beds", exact: true })).toBeVisible();
    await expect(supervisor.getByRole("button", { name: "View room 601 details" })).toBeVisible();
    await assertNoPageOverflow(supervisor);

    await supervisor.getByRole("button", { name: "User account menu" }).tap();
    await supervisor.getByRole("menuitem", { name: `${organizationName} · Owner`, exact: true }).tap();
    await expect(supervisor).toHaveURL(/\/owner$/);
    const owned = supervisor.getByRole("region", { name: "Hostels", exact: true });
    await expect(owned.getByRole("heading", { name: hostelName, exact: true })).toBeVisible();
    await expect(owned.getByRole("heading", { name: secondHostelName, exact: true })).toHaveCount(0);
  } finally {
    await context.close();
  }
});
