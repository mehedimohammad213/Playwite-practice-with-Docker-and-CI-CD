import type { Locator, Page } from "@playwright/test";

export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  locator(selector: string): Locator {
    return this.page.locator(selector);
  }

  async goto(path = "/"): Promise<void> {
    await this.page.goto(path, { timeout: 60000 });
  }
}
