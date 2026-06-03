import { Given, When, Then, Before, test } from "../support/fixtures";
import { TEST_USER } from "../support/test-data";

Before(async ({ $testInfo }) => {
  test.skip(
    $testInfo.project.name === "webkit",
    "WebKit is unstable for this site",
  );
});

Given("I am on the login page", async ({ loginPage }) => {
  await loginPage.goto();
});

When("I log in with valid credentials", async ({ loginPage }) => {
  await loginPage.login(TEST_USER.email, TEST_USER.password);
});

Then("I see the dashboard", async ({ adminPage }) => {
  await adminPage.waitForDashboard();
});

When("I click the dashboard link", async ({ adminPage }) => {
  await adminPage.clickDashboard();
});

When("I navigate to {string}", async ({ adminPage }, section: string) => {
  await adminPage.navigateTo(section);
});

When("I open push notifications", async ({ adminPage }) => {
  await adminPage.openPushNotifications();
});

When("I log out", async ({ adminPage }) => {
  await adminPage.logout();
});
