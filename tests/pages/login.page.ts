import type { Page } from "@playwright/test";
import { BasePage } from "./base.page";

export class LoginPage extends BasePage {
  readonly emailInput;
  readonly passwordInput;
  readonly loginButton;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByRole("textbox", {
      name: "Enter email address",
    });
    this.passwordInput = page.getByRole("textbox", { name: "Enter password" });
    this.loginButton = page.getByRole("button", { name: "Login" });
  }

  async goto() {
    await super.goto("/");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
