import type { Page } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput;
  readonly passwordInput;
  readonly loginButton;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByRole("textbox", {
      name: "Enter email address",
    });
    this.passwordInput = page.getByRole("textbox", { name: "Enter password" });
    this.loginButton = page.getByRole("button", { name: "Login" });
  }

  async goto() {
    await this.page.goto("https://kto-cms-ecru.vercel.app/", {
      timeout: 60000,
    });
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
