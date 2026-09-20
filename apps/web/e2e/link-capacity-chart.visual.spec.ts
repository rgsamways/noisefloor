import { expect, test } from "@playwright/test";

// Regression baseline against itself, not a fidelity grade against a real
// vendor screenshot — see openspec/changes/real-link-capacity-chart's
// design.md. Runs against /dev/gallery (dev-only route) rather than the
// landing page, so it isn't fragile to unrelated hero-copy/nav changes.
// Scoped to this component's own <section> (not the whole page) so adding
// other gallery entries elsewhere on the page doesn't churn this baseline —
// matches radio-family.visual.spec.ts's pattern.
test.describe("crm/LinkCapacityChart visual", () => {
  test("24h view", async ({ page }) => {
    await page.goto("/dev/gallery");
    const section = page.locator("section", { has: page.getByText("crm/LinkCapacityChart", { exact: true }) });
    await expect(section).toHaveScreenshot("link-capacity-chart-24h.png");
  });

  test("1y view", async ({ page }) => {
    await page.goto("/dev/gallery");
    const section = page.locator("section", { has: page.getByText("crm/LinkCapacityChart", { exact: true }) });
    await section.getByRole("button", { name: "1y" }).click();
    await expect(section).toHaveScreenshot("link-capacity-chart-1y.png");
  });
});
