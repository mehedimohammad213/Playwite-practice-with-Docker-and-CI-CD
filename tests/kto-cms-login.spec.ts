import { test } from "@playwright/test";
import { AdminPage } from "./pages/admin.page";
import { LoginPage } from "./pages/login.page";

test.skip(
  ({ browserName }) => browserName === "webkit",
  "WebKit is unstable for this site",
);

test("kto cms login and logout flow", async ({ page }) => {
  const loginPage = new LoginPage(page);
  const adminPage = new AdminPage(page);

  await loginPage.goto();
  await loginPage.login("mmhmasum98@gmail.com", "123456");

  await adminPage.clickDashboard();
  await adminPage.navigateTo("User Management");
  await adminPage.navigateTo("Parental Controls");
  await adminPage.navigateTo("Subscription");
  await adminPage.openPushNotifications();
  await adminPage.logout();
});
