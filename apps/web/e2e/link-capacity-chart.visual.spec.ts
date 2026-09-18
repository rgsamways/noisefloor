import { expect, test } from "@playwright/test";

// Regression baseline against itself, not a fidelity grade against a real
// vendor screenshot — see openspec/changes/real-link-capacity-chart's
// design.md. Runs against /dev/gallery (dev-only route) rather than the
// landing page, so it isn't fragile to unrelated hero-copy/nav changes.
test.describe("crm/LinkCapacityChart visual", () => {
  test("24h view", async ({ page }) => {
    await page.goto("/dev/gallery");
    await page.getByText("crm/LinkCapacityChart").waitFor();
    await expect(page.locator("main")).toHaveScreenshot("link-capacity-chart-24h.png");
  });

  test("1y view", async ({ page }) => {
    await page.goto("/dev/gallery");
    await page.getByText("crm/LinkCapacityChart").waitFor();
    await page.getByRole("button", { name: "1y" }).click();
    await expect(page.locator("main")).toHaveScreenshot("link-capacity-chart-1y.png");
  });
});
