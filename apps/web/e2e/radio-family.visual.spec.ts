import { expect, test } from "@playwright/test";

// Regression baseline against itself, matching link-capacity-chart.visual.spec.ts's
// pattern — see openspec/changes/radio-family-case-001-stages-2-3's design.md.
test.describe("radio/* visual", () => {
  test("LinkHeader", async ({ page }) => {
    await page.goto("/dev/gallery");
    const section = page.locator("section", { has: page.getByText("radio/LinkHeader", { exact: true }) });
    await expect(section).toHaveScreenshot("radio-link-header.png");
  });

  test("SignalPanel", async ({ page }) => {
    await page.goto("/dev/gallery");
    const section = page.locator("section", { has: page.getByText("radio/SignalPanel", { exact: true }) });
    await expect(section).toHaveScreenshot("radio-signal-panel.png");
  });

  test("RateBar", async ({ page }) => {
    await page.goto("/dev/gallery");
    const section = page.locator("section", { has: page.getByText("radio/RateBar", { exact: true }) });
    await expect(section).toHaveScreenshot("radio-rate-bar.png");
  });

  test("DeviceDetails", async ({ page }) => {
    await page.goto("/dev/gallery");
    const section = page.locator("section", { has: page.getByText("radio/DeviceDetails", { exact: true }) });
    await expect(section).toHaveScreenshot("radio-device-details.png");
  });
});
