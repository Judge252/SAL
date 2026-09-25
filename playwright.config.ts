import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: 2,
  timeout: 60000,
  use: { baseURL: "http://127.0.0.1:3107", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], channel: process.env.PLAYWRIGHT_CHANNEL } }],
  reporter: "list",
});
