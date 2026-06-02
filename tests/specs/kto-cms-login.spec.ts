import { test } from "../support/fixtures";
import { TEST_USER, NAVIGATION } from "../support/test-data";

test.skip(
  ({ browserName }) => browserName === "webkit",
  "WebKit is unstable for this site",
);

test("kto cms login and logout flow", async ({ loginPage, adminPage }) => {
  await loginPage.goto();
  await loginPage.login(TEST_USER.email, TEST_USER.password);

  await adminPage.waitForDashboard();
  await adminPage.clickDashboard();
  await adminPage.navigateTo(NAVIGATION.userManagement);
  await adminPage.navigateTo(NAVIGATION.parentalControls);
  await adminPage.navigateTo(NAVIGATION.subscription);
  await adminPage.openPushNotifications();
  await adminPage.logout();
});
