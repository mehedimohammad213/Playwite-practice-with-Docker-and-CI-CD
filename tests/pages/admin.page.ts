import type { Page, Locator } from "@playwright/test";

export class AdminPage {
  readonly page: Page;
  readonly rootLocator: Locator;
  readonly accountButton: Locator;
  readonly logoutText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.rootLocator = page.locator('[id="__next"]');
    this.accountButton = page.getByRole("button", {
      name: "account of current user",
    });
    this.logoutText = page.getByText("Logout", { exact: true }).first();
  }

  async clickDashboard() {
    const dashboardLink = this.rootLocator
      .getByText("Dashboard", { exact: true })
      .first();
    await dashboardLink.waitFor({ state: "visible" });
    await dashboardLink.click();
  }

  async navigateTo(navName: string) {
    await this.rootLocator.getByText(navName).first().click();
  }

  async openPushNotifications() {
    await this.page
      .getByRole("listitem")
      .filter({ hasText: "Push Notifications" })
      .first()
      .click();
  }

  async logout() {
    await this.accountButton.click();
    await this.logoutText.waitFor({ state: "visible" });
    const logoutElement = await this.logoutText.elementHandle();
    if (!logoutElement) throw new Error("Logout element not found");
    await logoutElement.evaluate((node: HTMLElement) => node.click());
  }
}
