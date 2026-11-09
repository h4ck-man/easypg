import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/live-db",
  outputDir: ".local-verification/live-db",
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: process.env.EASYPG_LOCAL_FRONTEND_URL || "http://127.0.0.1:5180",
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
