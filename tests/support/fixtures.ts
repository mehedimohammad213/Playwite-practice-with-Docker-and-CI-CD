import { test as base, type Page } from "@playwright/test";
import { AdminPage } from "../pages/admin.page";
import { LoginPage } from "../pages/login.page";

type Fixtures = {
  loginPage: LoginPage;
  adminPage: AdminPage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  adminPage: async ({ page }, use) => {
    await use(new AdminPage(page));
  },
});

export const expect = test.expect;
