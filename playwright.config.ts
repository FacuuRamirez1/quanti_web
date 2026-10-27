import { defineConfig, devices } from "@playwright/test";
import path from "path";

const baseURL = process.env.E2E_BASE_URL || "http://localhost:3105";

export default defineConfig({
  testDir: path.join(__dirname, "e2e"),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    channel: "msedge",
  },
  projects: [
    {
      name: "msedge",
      use: { ...devices["Desktop Edge"] },
    },
  ],
  webServer: {
    command: "npx next dev --port 3105",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  globalSetup: require.resolve("./e2e/global-setup"),
  globalTeardown: require.resolve("./e2e/global-teardown"),
});