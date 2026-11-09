import { expect, type Locator, type Page } from "@playwright/test";

export async function assertTouchTarget(control: Locator) {
  await expect(control).toBeVisible();
  const box = await control.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
}

export async function assertNoPageOverflow(page: Page) {
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
  expect(overflow, page.url()).toBeLessThanOrEqual(0);
}

export async function syntheticPng(page: Page, name: string, color: string) {
  const data = await page.evaluate((fill) => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, 32, 32);
    ctx.fillStyle = "#fff";
    ctx.fillRect(8, 8, 16, 16);
    return canvas.toDataURL("image/png").split(",")[1];
  }, color);
  return { name, mimeType: "image/png", buffer: Buffer.from(data, "base64") };
}

export async function fillRegistration(
  page: Page,
  name: string,
  phone: string,
) {
  const person = page.getByLabel("Resident portrait", { exact: true });
  const identity = page.getByLabel("Identity document", { exact: true });
  await expect(person).toHaveAttribute("capture", "user");
  await expect(identity).toHaveAttribute("capture", "environment");
  await assertTouchTarget(person);
  await assertTouchTarget(identity);

  const portraitFile = await syntheticPng(
    page,
    "synthetic-portrait.png",
    "#195e90",
  );
  const identityFile = await syntheticPng(
    page,
    "synthetic-identity.png",
    "#904819",
  );
  await person.setInputFiles(portraitFile);
  await identity.setInputFiles(identityFile);
  await expect(
    page.getByRole("img", { name: "Resident portrait preview" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Identity document preview" }),
  ).toBeVisible();

  await page.getByLabel(/Full name/i).fill(name);
  const phoneField = page.getByLabel(/Phone number/i);
  await expect(phoneField).toHaveAttribute("type", "tel");
  await phoneField.fill(phone);
}
