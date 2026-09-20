import { expect, test } from "@playwright/test";

// Regression baseline against itself, matching radio-family.visual.spec.ts's
// pattern — scoped to each component's own <section> so unrelated gallery
// growth doesn't churn these baselines (see dashboard-visual-richness's
// own lesson about that coupling).
test.describe("shaper-incident dashboard family visual", () => {
  test("RealtimePingModal", async ({ page }) => {
    await page.goto("/dev/gallery");
    const section = page.locator("section", { has: page.getByText("crm/RealtimePingModal", { exact: true }) });
    await expect(section).toHaveScreenshot("crm-realtime-ping-modal.png");
  });

  test("DeviceOverview", async ({ page }) => {
    await page.goto("/dev/gallery");
    const section = page.locator("section", { has: page.getByText("nms/DeviceOverview", { exact: true }) });
    await expect(section).toHaveScreenshot("nms-device-overview.png");
  });

  test("DeviceManagePane", async ({ page }) => {
    await page.goto("/dev/gallery");
    const section = page.locator("section", { has: page.getByText("nms/DeviceManagePane", { exact: true }) });
    await expect(section).toHaveScreenshot("nms-device-manage-pane.png");
  });

  test("ApStationList", async ({ page }) => {
    await page.goto("/dev/gallery");
    const section = page.locator("section", { has: page.getByText("nms/ApStationList", { exact: true }) });
    await expect(section).toHaveScreenshot("nms-ap-station-list.png");
  });
});
