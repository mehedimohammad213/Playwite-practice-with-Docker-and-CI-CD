import { test, expect } from "@playwright/test";

test.skip(
  ({ browserName }) => browserName === "webkit",
  "WebKit is unstable for this site",
);

test("kto cms login and logout flow", async ({ page }) => {
  await page.goto("https://kto-cms-ecru.vercel.app/", {
    timeout: 60000,
  });

  await page
    .getByRole("textbox", { name: "Enter email address" })
    .fill("mmhmasum98@gmail.com");
  await page.getByRole("textbox", { name: "Enter password" }).fill("123456");
  await page.getByRole("button", { name: "Login" }).click();

  const dashboardLink = page
    .locator('[id="__next"]')
    .getByText("Dashboard", { exact: true })
    .first();
  await expect(dashboardLink).toBeVisible();
  await dashboardLink.click();

  await page
    .locator('[id="__next"]')
    .getByText("User Management")
    .first()
    .click();
  await page
    .locator('[id="__next"]')
    .getByText("Parental Controls")
    .first()
    .click();
  await page.locator('[id="__next"]').getByText("Subscription").first().click();

  await page
    .getByRole("listitem")
    .filter({ hasText: "Push Notifications" })
    .first()
    .click();

  await page.getByRole("button", { name: "account of current user" }).click();
  const logout = page.getByText("Logout", { exact: true }).first();
  await expect(logout).toBeVisible();
  const logoutElement = await logout.elementHandle();
  if (!logoutElement) throw new Error("Logout element not found");
  await logoutElement.evaluate((node: HTMLElement) => node.click());
});
