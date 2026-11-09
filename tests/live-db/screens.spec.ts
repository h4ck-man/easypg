import { expect, test } from "@playwright/test";
import {
  assertNoPageOverflow,
  assertTouchTarget,
} from "../support/synthetic-resident";

const propertyScreens = [
  "/dashboard",
  "/rooms",
  "/residents",
  "/residents/new",
  "/residents/sample-resident",
  "/check-ins",
  "/check-outs",
  "/payments",
  "/reports",
  "/settings",
];

const roles = [
  { account: "manager", home: '/supervisor', screens: [...propertyScreens, '/supervisor', '/leaving-soon', '/inquiries'] },
  { account: "supervisor", home: '/supervisor', screens: ['/supervisor', '/leaving-soon', '/inquiries', '/rooms', '/residents', '/check-ins', '/check-outs', '/payments', '/reports', '/settings'] },
  { account: "owner", home: '/portfolio', screens: [...propertyScreens, "/hostels", "/managers", '/portfolio', '/setup', '/leaving-soon'] },
  { account: "hostelowner", home: '/owner', screens: ['/owner', '/hostels', '/rooms', '/residents', '/leaving-soon', '/payments', '/reports', '/settings'] },
  {
    account: "admin",
    home: '/admin',
    screens: [
      "/dashboard",
      "/organizations",
      "/hostels",
      "/managers",
      "/reports",
      "/settings",
      '/admin',
      '/setup',
    ],
  },
];

for (const layout of [
  { name: "mobile", width: 390, height: 844, mobile: true },
  { name: "desktop", width: 1440, height: 900, mobile: false },
]) {
  test.describe(layout.name, () => {
    test.use({
      viewport: { width: layout.width, height: layout.height },
      isMobile: layout.mobile,
      hasTouch: layout.mobile,
    });

    for (const { account, home, screens } of roles) {
      test(`${account} can open every workspace screen against the local API`, async ({
        page,
      }) => {
        const password = process.env.EASYPG_LOCAL_TEST_PASSWORD;
        if (!password)
          throw new Error(
            "Set EASYPG_LOCAL_TEST_PASSWORD to the local synthetic account password.",
          );
        const pageErrors: string[] = [];
        const apiErrors: string[] = [];
        page.on("pageerror", (error) => pageErrors.push(error.message));
        page.on("response", (response) => {
          const path = new URL(response.url()).pathname;
          if (path.startsWith("/api/v1/") && response.status() >= 400) {
            apiErrors.push(`${response.status()} ${path}`);
          }
        });
        await page.goto("/login");
        await page.locator('[name="email"]').fill(`${account}@easypg.local`);
        await page.locator('[name="password"]').fill(password);
        const signIn = page.getByRole("button", {
          name: "Sign in",
          exact: true,
        });
        if (layout.mobile) await assertTouchTarget(signIn);
        await signIn.click();
        await expect(page).toHaveURL(new RegExp(home + '$'));

        for (const path of screens) {
          await test.step(path, async () => {
            await page.goto(path);
            await expect(
              page.getByRole("heading", { level: 1 }).first(),
            ).toBeVisible();
            expect(new URL(page.url()).pathname).toBe(path);
            await expect(
              page.getByText("This page could not be loaded", { exact: true }),
            ).toHaveCount(0);
            await expect(
              page.getByText("Live workspace", { exact: true }),
            ).toBeVisible();
            await assertNoPageOverflow(page);

            if (layout.mobile) {
              const shortcuts = page.getByRole("navigation", {
                name: "Mobile shortcuts",
              });
              if (path === "/residents/new" || path === "/check-ins") {
                await expect(shortcuts).not.toBeVisible();
              } else {
                await expect(shortcuts).toBeVisible();
                for (const link of await shortcuts.getByRole("link").all())
                  await assertTouchTarget(link);
              }
              await assertTouchTarget(
                page.getByRole("button", { name: "User account menu" }),
              );
              await assertTouchTarget(
                page.getByRole("button", {
                  name: /Use (light|dark) appearance/,
                }),
              );
            }
          });
        }
        expect(pageErrors).toEqual([]);
        expect(apiErrors).toEqual([]);
      });
    }
  });
}
